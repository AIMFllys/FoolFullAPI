import { Response, NextFunction } from 'express';
import db from '../config/database';
import type { ApiKeyRequest, UserRow } from '../types';

export function apiKeyAuthMiddleware(req: ApiKeyRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) {
    res.status(401).json({ success: false, error: { code: 'NO_API_KEY', message: 'Missing API Key' } });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(apiKey) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API Key' } });
    return;
  }
  req.user = user;
  next();
}
