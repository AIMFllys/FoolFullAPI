import { Router, Response } from 'express';
import db from '../config/database';
import { env } from '../config/env';
import { apiKeyAuthMiddleware } from '../middleware/apiKeyAuth';
import { validateMessage } from '../utils/validators';
import { processChat } from '../services/chatService';
import type { ApiKeyRequest, GlobalStatsRow } from '../types';

const router = Router();

router.post('/chat', apiKeyAuthMiddleware, async (req: ApiKeyRequest, res: Response): Promise<void> => {
  const { message } = req.body;
  const msgErr = validateMessage(message);
  if (msgErr) { res.status(400).json({ error: msgErr }); return; }

  const user = req.user!;

  if (user.is_banned || user.ask_count >= env.maxAskPerUser) {
    res.status(403).json({ error: '体验次数已用完' });
    return;
  }

  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ error: '今日体验次数已用完' });
    return;
  }

  const currentStep = user.step;

  if (currentStep === 1) {
    db.prepare('UPDATE users SET first_message = ? WHERE id = ?').run(message.trim(), user.id);
  }

  // API mode always uses IDE mode
  const result = await processChat(message.trim(), currentStep, user.first_message, true);

  const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
  const newAskCount = user.ask_count + 1;
  const isBanned = newAskCount >= env.maxAskPerUser ? 1 : 0;
  const firstMessage = nextStep === 1 ? null : user.first_message;

  db.prepare(
    "UPDATE users SET step = ?, ask_count = ?, is_banned = ?, first_message = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(nextStep, newAskCount, isBanned, currentStep === 1 ? message.trim() : firstMessage, user.id);

  if (currentStep !== 2 && currentStep !== 6) {
    db.prepare('UPDATE global_stats SET daily_api_count = daily_api_count + 1, total_asks = total_asks + 1 WHERE id = 1').run();
  } else {
    db.prepare('UPDATE global_stats SET total_asks = total_asks + 1 WHERE id = 1').run();
  }

  db.prepare(
    'INSERT INTO chat_logs (user_id, step, user_msg, ai_reply, model_used, source) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(user.id, currentStep, message.trim(), result.reply, result.modelUsed, 'api');

  // Fake usage stats for realism
  const fakePromptTokens = 100 + Math.floor(Math.random() * 100);
  const fakeCompletionTokens = 20 + Math.floor(Math.random() * 60);

  res.json({
    reply: result.reply,
    step: currentStep,
    remaining: env.maxAskPerUser - newAskCount,
    model: 'claude-opos4-mu4.6',
    usage: {
      prompt_tokens: fakePromptTokens,
      completion_tokens: fakeCompletionTokens,
      total_tokens: fakePromptTokens + fakeCompletionTokens,
    },
  });
});

export default router;
