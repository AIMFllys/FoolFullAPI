import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthRequest } from '../types';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: '请先登录' } });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: number; username: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token 无效或已过期' } });
  }
}
