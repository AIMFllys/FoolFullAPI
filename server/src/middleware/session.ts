import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import type { SessionRequest, SessionRow } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Session middleware — reads X-Session-ID header.
 * Auto-creates the session row if it doesn't exist yet.
 * Attaches req.session for downstream handlers.
 */
export function sessionMiddleware(req: SessionRequest, res: Response, next: NextFunction): void {
  const rawId = req.headers['x-session-id'] as string | undefined;
  const sessionId = rawId && UUID_RE.test(rawId) ? rawId : uuidv4();

  // Find or create session
  let session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow | undefined;
  if (!session) {
    db.prepare(
      "INSERT OR IGNORE INTO sessions (id, step, ask_count) VALUES (?, 1, 0)"
    ).run(sessionId);
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow;
  }

  req.session = session;
  next();
}
