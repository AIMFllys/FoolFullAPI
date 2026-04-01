import { Router, Response } from 'express';
import db from '../config/database';
import { env } from '../config/env';
import { sessionMiddleware } from '../middleware/session';
import { validateMessage, parseChatMode } from '../utils/validators';
import { generateDeepChat, streamDeepChat } from '../services/deepChatService';
import { processNormalChat } from '../services/normalChatService';
import type { ChatRequestBody, GlobalStatsRow, SessionRequest } from '../types';

const router = Router();

router.post('/', sessionMiddleware, async (req: SessionRequest, res: Response): Promise<void> => {
  const { message, mode } = req.body as ChatRequestBody;
  const msgErr = validateMessage(message);
  if (msgErr) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: msgErr } });
    return;
  }

  const chatMode = parseChatMode(mode);
  const session = req.session!;
  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ success: false, error: { code: 'DAILY_LIMIT', message: '今日调用次数已用完，请明日再来。' } });
    return;
  }

  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (chatMode === 'normal') {
    const currentStep = session.step;

    if (currentStep === 1) {
      db.prepare('UPDATE sessions SET first_message = ? WHERE id = ?').run(trimmedMessage, session.id);
    }

    const result = await processNormalChat(trimmedMessage, currentStep, session.first_message, !!session.is_ide_mode);
    const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
    const newAskCount = session.ask_count + 1;
    const nextFirstMessage = nextStep === 1 ? null : currentStep === 1 ? trimmedMessage : session.first_message;

    db.prepare(
      "UPDATE sessions SET step = ?, ask_count = ?, first_message = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(nextStep, newAskCount, nextFirstMessage, session.id);

    bumpStats(currentStep !== 2 && currentStep !== 6);
    logChat(session.id, currentStep, trimmedMessage, result.reply, result.modelUsed, 'web');

    res.json({
      success: true,
      data: {
        reply: result.reply,
        step: currentStep,
        remaining: null,
        isEasterEgg: result.isEasterEgg,
        mode: chatMode,
        model: result.modelUsed,
      },
    });
    return;
  }

  try {
    const result = await generateDeepChat(trimmedMessage);
    db.prepare(
      "UPDATE sessions SET ask_count = ask_count + 1, updated_at = datetime('now') WHERE id = ?",
    ).run(session.id);

    bumpStats(true);
    logChat(session.id, null, trimmedMessage, result.rawXml, result.modelUsed, 'web');

    res.json({
      success: true,
      data: {
        reply: result.sections.answer,
        step: null,
        remaining: null,
        isEasterEgg: false,
        mode: chatMode,
        model: result.modelUsed,
        rawXml: result.rawXml,
        sections: result.sections,
        sourceItems: result.sourceItems,
      },
    });
  } catch (error) {
    console.error('[DeepChat][web] request failed:', error);
    res.status(502).json({
      success: false,
      error: {
        code: 'DEEP_MODE_FAILED',
        message: error instanceof Error ? error.message : '深度模式调用失败，请稍后再试。',
      },
    });
  }
});

router.post('/stream', sessionMiddleware, async (req: SessionRequest, res: Response): Promise<void> => {
  const { message, mode } = req.body as ChatRequestBody;
  const msgErr = validateMessage(message);
  if (msgErr) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: msgErr } });
    return;
  }

  const chatMode = parseChatMode(mode);
  if (chatMode === 'normal') {
    res.status(400).json({ success: false, error: { code: 'NORMAL_STREAM_DISABLED', message: '普通模式不使用流式接口，请调用 /api/chat。' } });
    return;
  }

  const session = req.session!;
  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ success: false, error: { code: 'DAILY_LIMIT', message: '今日调用次数已用完，请明日再来。' } });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  try {
    const result = await streamDeepChat(trimmedMessage, {
      onMeta: (meta) => writeSse(res, 'meta', meta),
      onSource: ({ labels, items }) => writeSse(res, 'source', { labels, items }),
      onThink: (content) => writeSse(res, 'think', { content }),
      onPlan: (content) => writeSse(res, 'plan', { content }),
      onReview: (content) => writeSse(res, 'review', { content }),
      onAnswerDelta: (delta) => writeSse(res, 'answer_delta', { delta }),
    });

    db.prepare(
      "UPDATE sessions SET ask_count = ask_count + 1, updated_at = datetime('now') WHERE id = ?",
    ).run(session.id);
    bumpStats(true);
    logChat(session.id, null, trimmedMessage, result.rawXml, result.modelUsed, 'web');

    writeSse(res, 'done', {
      mode: chatMode,
      model: result.modelUsed,
      rawXml: result.rawXml,
      sections: result.sections,
      sourceItems: result.sourceItems,
    });
  } catch (error) {
    console.error('[DeepChat][web][stream] failed:', error);
    writeSse(res, 'error', {
      code: 'DEEP_MODE_FAILED',
      message: error instanceof Error ? error.message : '深度模式流式调用失败，请稍后再试。',
    });
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

function logChat(sessionId: string, step: number | null, userMessage: string, reply: string, modelUsed: string, source: 'web' | 'api'): void {
  db.prepare(
    'INSERT INTO chat_logs (session_id, step, user_msg, ai_reply, model_used, source) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(sessionId, step ?? 0, userMessage, reply, modelUsed, source);
}

function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default router;
