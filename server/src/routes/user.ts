import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest, UserRow } from '../types';

const router = Router();

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as UserRow | undefined;
  if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } }); return; }

  res.json({
    success: true,
    data: {
      username: user.username,
      apiKey: user.api_key,
      askCount: user.ask_count,
      step: user.step,
      isBanned: !!user.is_banned,
    },
  });
});

router.get('/api-key', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as UserRow | undefined;
  if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } }); return; }

  let apiKey = user.api_key;
  if (!apiKey) {
    apiKey = uuidv4();
    db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(apiKey, user.id);
  }

  res.json({ success: true, data: { apiKey } });
});

router.post('/api-key/regenerate', authMiddleware, (req: AuthRequest, res: Response): void => {
  const newKey = uuidv4();
  db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(newKey, req.user!.userId);
  res.json({ success: true, data: { apiKey: newKey } });
});

export default router;
