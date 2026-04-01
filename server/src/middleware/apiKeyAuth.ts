import { Response, NextFunction } from 'express';
import { env } from '../config/env';
import type { SessionRequest } from '../types';

/**
 * Optional API key guard for /api/v1 (external callers).
 * If MASTER_API_KEY is empty in env → open access (no key required).
 * If set → Authorization: Bearer <key> must match.
 */
export function apiKeyAuthMiddleware(req: SessionRequest, res: Response, next: NextFunction): void {
  if (!env.masterApiKey) {
    next();
    return;
  }
  const key = req.headers.authorization?.replace('Bearer ', '').trim();
  if (key !== env.masterApiKey) {
    res.status(401).json({ error: 'Invalid or missing API Key' });
    return;
  }
  next();
}
