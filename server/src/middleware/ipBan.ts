import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

interface IpRecord {
  count: number;
  resetAt: number;
  bannedUntil: number | null;
}

const ipStore = new Map<string, IpRecord>();

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore) {
    if (now > record.resetAt && (!record.bannedUntil || now > record.bannedUntil)) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function ipBanMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = ipStore.get(ip) || { count: 0, resetAt: now + 5 * 60 * 1000, bannedUntil: null };

  if (record.bannedUntil && now < record.bannedUntil) {
    res.status(429).json({ success: false, error: { code: 'IP_BANNED', message: '请求过于频繁，请稍后再试' } });
    return;
  }

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 5 * 60 * 1000;
    record.bannedUntil = null;
  }

  record.count++;

  if (record.count > env.ipBanThreshold) {
    record.bannedUntil = now + env.ipBanDurationMinutes * 60 * 1000;
    ipStore.set(ip, record);
    res.status(429).json({ success: false, error: { code: 'IP_BANNED', message: '请求过于频繁，请稍后再试' } });
    return;
  }

  ipStore.set(ip, record);
  next();
}
