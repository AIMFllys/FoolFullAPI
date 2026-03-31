import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { env } from '../config/env';
import { validateUsername, validatePassword } from '../utils/validators';
import type { UserRow } from '../types';

const router = Router();

router.post('/register', (req: Request, res: Response): void => {
  const { username, password, agreedToTerms } = req.body;

  const usernameErr = validateUsername(username);
  if (usernameErr) { res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: usernameErr } }); return; }

  const passwordErr = validatePassword(password);
  if (passwordErr) { res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: passwordErr } }); return; }

  if (agreedToTerms !== true) {
    res.status(400).json({ success: false, error: { code: 'TERMS_NOT_AGREED', message: '请先同意服务条款和隐私政策' } });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ success: false, error: { code: 'USERNAME_EXISTS', message: '用户名已存在' } });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const apiKey = uuidv4();

  const result = db.prepare(
    'INSERT INTO users (username, password, api_key) VALUES (?, ?, ?)',
  ).run(username, hashedPassword, apiKey);

  db.prepare('UPDATE global_stats SET total_users = total_users + 1 WHERE id = 1').run();

  const token = jwt.sign({ userId: result.lastInsertRowid, username }, env.jwtSecret, { expiresIn: '24h' });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { username, apiKey, askCount: 0, isBanned: false },
    },
  });
});

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: '用户名或密码错误' } });
    return;
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, env.jwtSecret, { expiresIn: '24h' });

  res.json({
    success: true,
    data: {
      token,
      user: {
        username: user.username,
        apiKey: user.api_key,
        askCount: user.ask_count,
        step: user.step,
        isBanned: !!user.is_banned,
      },
    },
  });
});

export default router;
