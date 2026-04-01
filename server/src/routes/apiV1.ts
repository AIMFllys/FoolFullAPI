import { Router, Response } from 'express';
import db from '../config/database';
import { env } from '../config/env';
import { sessionMiddleware } from '../middleware/session';
import { apiKeyAuthMiddleware } from '../middleware/apiKeyAuth';
import { validateMessage, parseChatMode } from '../utils/validators';
import { generateDeepChat, streamDeepChat } from '../services/deepChatService';
import { processNormalChat } from '../services/normalChatService';
import { escapeXml } from '../utils/xml';
import type { ChatRequestBody, GlobalStatsRow, SessionRequest } from '../types';

const router = Router();

router.post('/chat', apiKeyAuthMiddleware, sessionMiddleware, async (req: SessionRequest, res: Response): Promise<void> => {
  const { message, mode } = req.body as ChatRequestBody;
  const msgErr = validateMessage(message);
  if (msgErr) {
    res.status(400).json({ error: msgErr });
    return;
  }

  const session = req.session!;
  const chatMode = parseChatMode(mode);
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ error: '今日调用次数已用完，请明日再来。' });
    return;
  }

  if (chatMode === 'normal') {
    const currentStep = session.step;
    if (currentStep === 1) {
      db.prepare('UPDATE sessions SET first_message = ? WHERE id = ?').run(trimmedMessage, session.id);
    }

    const result = await processNormalChat(trimmedMessage, currentStep, session.first_message, true);
    const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
    const nextFirstMessage = nextStep === 1 ? null : currentStep === 1 ? trimmedMessage : session.first_message;

    db.prepare(
      "UPDATE sessions SET step = ?, ask_count = ask_count + 1, first_message = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(nextStep, nextFirstMessage, session.id);

    bumpStats(currentStep !== 2 && currentStep !== 6);
    logChat(session.id, currentStep, trimmedMessage, result.reply, result.modelUsed);

    res.json({
      reply: result.reply,
      step: currentStep,
      remaining: null,
      mode: chatMode,
      model: result.modelUsed,
    });
    return;
  }

  try {
    const result = await generateDeepChat(trimmedMessage);
    db.prepare("UPDATE sessions SET ask_count = ask_count + 1, updated_at = datetime('now') WHERE id = ?").run(session.id);
    bumpStats(true);
    logChat(session.id, null, trimmedMessage, result.rawXml, result.modelUsed);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(result.rawXml);
  } catch (error) {
    console.error('[DeepChat][api] request failed:', error);
    res.status(502).json({ error: error instanceof Error ? error.message : '深度模式调用失败，请稍后再试。' });
  }
});

router.post('/chat/stream', apiKeyAuthMiddleware, sessionMiddleware, async (req: SessionRequest, res: Response): Promise<void> => {
  const { message, mode } = req.body as ChatRequestBody;
  const msgErr = validateMessage(message);
  if (msgErr) {
    res.status(400).json({ error: msgErr });
    return;
  }

  const session = req.session!;
  const chatMode = parseChatMode(mode);
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ error: '今日调用次数已用完，请明日再来。' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  if (chatMode === 'normal') {
    const currentStep = session.step;
    if (currentStep === 1) {
      db.prepare('UPDATE sessions SET first_message = ? WHERE id = ?').run(trimmedMessage, session.id);
    }

    const result = await processNormalChat(trimmedMessage, currentStep, session.first_message, true);
    const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
    const nextFirstMessage = nextStep === 1 ? null : currentStep === 1 ? trimmedMessage : session.first_message;

    db.prepare(
      "UPDATE sessions SET step = ?, ask_count = ask_count + 1, first_message = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(nextStep, nextFirstMessage, session.id);

    bumpStats(currentStep !== 2 && currentStep !== 6);
    logChat(session.id, currentStep, trimmedMessage, result.reply, result.modelUsed);

    writeSse(res, 'message', { reply: result.reply, step: currentStep, mode: chatMode, model: result.modelUsed });
    writeSse(res, 'done', { mode: chatMode });
    res.end();
    return;
  }

  try {
    let answerStarted = false;
    const result = await streamDeepChat(trimmedMessage, {
      onMeta: (meta) => writeSse(res, 'meta', meta),
      onSource: ({ xml }) => writeSse(res, 'xml', { chunk: xml }),
      onThink: (content) => writeSse(res, 'xml', { chunk: `<think>${escapeXml(content)}</think>` }),
      onPlan: (content) => writeSse(res, 'xml', { chunk: `<plan>${escapeXml(content)}</plan>` }),
      onReview: (content) => writeSse(res, 'xml', { chunk: `<review>${escapeXml(content)}</review>` }),
      onAnswerDelta: (delta) => {
        if (!answerStarted) {
          answerStarted = true;
          writeSse(res, 'xml', { chunk: '<answer>' });
        }
        writeSse(res, 'xml', { chunk: escapeXml(delta) });
      },
    });

    if (answerStarted) {
      writeSse(res, 'xml', { chunk: '</answer>' });
    } else {
      writeSse(res, 'xml', { chunk: `<answer>${escapeXml(result.sections.answer)}</answer>` });
    }

    db.prepare("UPDATE sessions SET ask_count = ask_count + 1, updated_at = datetime('now') WHERE id = ?").run(session.id);
    bumpStats(true);
    logChat(session.id, null, trimmedMessage, result.rawXml, result.modelUsed);

    writeSse(res, 'done', { mode: chatMode, model: result.modelUsed });
  } catch (error) {
    console.error('[DeepChat][api][stream] request failed:', error);
    writeSse(res, 'error', { code: 'DEEP_MODE_FAILED', message: error instanceof Error ? error.message : '深度模式流式调用失败，请稍后再试。' });
  } finally {
    res.end();
  }
});

function bumpStats(countApi: boolean): void {
  if (countApi) {
    db.prepare('UPDATE global_stats SET daily_api_count = daily_api_count + 1, total_asks = total_asks + 1 WHERE id = 1').run();
  } else {
    db.prepare('UPDATE global_stats SET total_asks = total_asks + 1 WHERE id = 1').run();
  }
}

function logChat(sessionId: string, step: number | null, userMessage: string, reply: string, modelUsed: string): void {
  db.prepare(
    'INSERT INTO chat_logs (session_id, step, user_msg, ai_reply, model_used, source) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(sessionId, step ?? 0, userMessage, reply, modelUsed, 'api');
}

function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default router;
