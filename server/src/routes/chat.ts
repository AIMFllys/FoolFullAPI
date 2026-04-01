import { Router, Response } from 'express';
import db from '../config/database';
import { env } from '../config/env';
import { sessionMiddleware } from '../middleware/session';
import { validateMessage } from '../utils/validators';
import { processChat } from '../services/chatService';
import type { SessionRequest, GlobalStatsRow, SessionRow } from '../types';

const router = Router();

router.post('/', sessionMiddleware, async (req: SessionRequest, res: Response): Promise<void> => {
  const { message } = req.body;
  const msgErr = validateMessage(message);
  if (msgErr) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: msgErr } });
    return;
  }

  const session = req.session!;

  if (session.ask_count >= env.maxAskPerSession) {
    res.status(403).json({ success: false, error: { code: 'LIMIT_REACHED', message: '您的体验次数已用完，感谢参与！' } });
    return;
  }

  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  if (stats.daily_api_count >= env.maxDailyApiCalls) {
    res.status(503).json({ success: false, error: { code: 'DAILY_LIMIT', message: '今日体验次数已用完，请明日再来 🌙' } });
    return;
  }

  const currentStep = session.step;

  // Store first_message on Step 1
  if (currentStep === 1) {
    db.prepare('UPDATE sessions SET first_message = ? WHERE id = ?').run(message.trim(), session.id);
  }

  const result = await processChat(message.trim(), currentStep, session.first_message, !!session.is_ide_mode);

  // Advance step (cycles 1→6→1)
  const nextStep = currentStep >= 6 ? 1 : currentStep + 1;
  const newAskCount = session.ask_count + 1;
  const firstMessage = nextStep === 1 ? null : session.first_message;

  db.prepare(
    "UPDATE sessions SET step = ?, ask_count = ?, first_message = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(nextStep, newAskCount, currentStep === 1 ? message.trim() : firstMessage, session.id);

  // Update global stats (only for steps that call API)
  if (currentStep !== 2 && currentStep !== 6) {
    db.prepare('UPDATE global_stats SET daily_api_count = daily_api_count + 1, total_asks = total_asks + 1 WHERE id = 1').run();
  } else {
    db.prepare('UPDATE global_stats SET total_asks = total_asks + 1 WHERE id = 1').run();
  }

  // Log
  db.prepare(
    'INSERT INTO chat_logs (session_id, step, user_msg, ai_reply, model_used, source) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(session.id, currentStep, message.trim(), result.reply, result.modelUsed, 'web');

  res.json({
    success: true,
    data: {
      reply: result.reply,
      step: currentStep,
      remaining: env.maxAskPerSession - newAskCount,
      isEasterEgg: result.isEasterEgg,
    },
  });
});

export default router;
