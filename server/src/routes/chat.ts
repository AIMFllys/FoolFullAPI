import { Router, Response } from 'express';
import db from '../config/database';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';
import { validateMessage } from '../utils/validators';
import { processChat } from '../services/chatService';
import type { AuthRequest, UserRow, GlobalStatsRow } from '../types';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { message } = req.body;
  const msgErr = validateMessage(message);
  if (msgErr) { res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: msgErr } }); return; }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as UserRow | undefined;
  if (!user) { res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: '用户不存在' } }); return; }

  if (user.is_banned || user.ask_count >= env.maxAskPerUser) {
    res.status(403).json({ success: false, error: { code: 'BANNED', message: '您的体验次数已用完，感谢参与！' } });
    return;
  }

  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ success: false, error: { code: 'DAILY_LIMIT', message: '今日体验次数已用完，请明日再来 🌙' } });
    return;
  }

  const currentStep = user.step;

  // Store first_message on Step 1
  if (currentStep === 1) {
    db.prepare('UPDATE users SET first_message = ? WHERE id = ?').run(message.trim(), user.id);
  }

  const result = await processChat(message.trim(), currentStep, user.first_message, !!user.is_ide_mode);

  // Update step and ask_count
  const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
  const newAskCount = user.ask_count + 1;
  const isBanned = newAskCount >= env.maxAskPerUser ? 1 : 0;
  const firstMessage = nextStep === 1 ? null : user.first_message;

  db.prepare(
    "UPDATE users SET step = ?, ask_count = ?, is_banned = ?, first_message = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(nextStep, newAskCount, isBanned, currentStep === 1 ? message.trim() : firstMessage, user.id);

  // Update global stats (only for steps that call API)
  if (currentStep !== 2 && currentStep !== 6) {
    db.prepare('UPDATE global_stats SET daily_api_count = daily_api_count + 1, total_asks = total_asks + 1 WHERE id = 1').run();
  } else {
    db.prepare('UPDATE global_stats SET total_asks = total_asks + 1 WHERE id = 1').run();
  }

  // Log
  db.prepare(
    'INSERT INTO chat_logs (user_id, step, user_msg, ai_reply, model_used, source) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(user.id, currentStep, message.trim(), result.reply, result.modelUsed, 'web');

  res.json({
    success: true,
    data: {
      reply: result.reply,
      step: currentStep,
      remaining: env.maxAskPerUser - newAskCount,
      isEasterEgg: result.isEasterEgg,
    },
  });
});

export default router;
