import { Router, Response } from 'express';
import db from '../config/database';
import { env } from '../config/env';
import { sessionMiddleware } from '../middleware/session';
import { apiKeyAuthMiddleware } from '../middleware/apiKeyAuth';
import { validateMessage } from '../utils/validators';
import { processChat } from '../services/chatService';
import type { SessionRequest, GlobalStatsRow } from '../types';

const router = Router();

// External API: optional API key + session tracking
router.post('/chat', apiKeyAuthMiddleware, sessionMiddleware, async (req: SessionRequest, res: Response): Promise<void> => {
  const { message } = req.body;
  const msgErr = validateMessage(message);
  if (msgErr) { res.status(400).json({ error: msgErr }); return; }

  const session = req.session!;

  if (session.ask_count >= env.maxAskPerSession) {
    res.status(403).json({ error: '体验次数已用完' });
    return;
  }

  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ error: '今日体验次数已用完' });
    return;
  }

  const currentStep = session.step;

  if (currentStep === 1) {
    db.prepare('UPDATE sessions SET first_message = ? WHERE id = ?').run(message.trim(), session.id);
  }

  // API mode always uses IDE mode
  const result = await processChat(message.trim(), currentStep, session.first_message, true);

  const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
  const newAskCount = session.ask_count + 1;
  const firstMessage = nextStep === 1 ? null : session.first_message;

  db.prepare(
    "UPDATE sessions SET step = ?, ask_count = ?, first_message = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(nextStep, newAskCount, currentStep === 1 ? message.trim() : firstMessage, session.id);

  if (currentStep !== 2 && currentStep !== 6) {
    db.prepare('UPDATE global_stats SET daily_api_count = daily_api_count + 1, total_asks = total_asks + 1 WHERE id = 1').run();
  } else {
    db.prepare('UPDATE global_stats SET total_asks = total_asks + 1 WHERE id = 1').run();
  }

  db.prepare(
    'INSERT INTO chat_logs (session_id, step, user_msg, ai_reply, model_used, source) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(session.id, currentStep, message.trim(), result.reply, result.modelUsed, 'api');

  // Fake usage stats for realism
  const fakePromptTokens = 100 + Math.floor(Math.random() * 100);
  const fakeCompletionTokens = 20 + Math.floor(Math.random() * 60);

  res.json({
    reply: result.reply,
    step: currentStep,
    remaining: env.maxAskPerSession - newAskCount,
    model: 'claude-opos4-mu4.6',
    usage: {
      prompt_tokens: fakePromptTokens,
      completion_tokens: fakeCompletionTokens,
      total_tokens: fakePromptTokens + fakeCompletionTokens,
    },
  });
});

export default router;
