import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from './env';

const dbDir = path.dirname(path.resolve(env.dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: DatabaseType = new Database(path.resolve(env.dbPath));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ─────────────────────────────────────────────────────────────

db.exec(`
  -- Anonymous sessions table (no user accounts)
  CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT    PRIMARY KEY,
    step          INTEGER NOT NULL DEFAULT 1,
    ask_count     INTEGER NOT NULL DEFAULT 0,
    is_ide_mode   INTEGER NOT NULL DEFAULT 0,
    first_message TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS global_stats (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    total_asks      INTEGER NOT NULL DEFAULT 0,
    daily_api_count INTEGER NOT NULL DEFAULT 0,
    last_reset_date TEXT    NOT NULL DEFAULT (date('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);

  INSERT OR IGNORE INTO global_stats (id) VALUES (1);
`);

// ── Migrate chat_logs ─────────────────────────────────────────────────────────
// The old schema had: user_id INTEGER NOT NULL (no session_id)
// We need chat_logs to exist with a session_id column.
// Strategy: if the old table exists without session_id, drop and recreate it.
// If it's already the new schema, do nothing.

const chatLogsInfo = db.prepare("PRAGMA table_info(chat_logs)").all() as { name: string }[];
const hasSessionId = chatLogsInfo.some(col => col.name === 'session_id');

if (chatLogsInfo.length === 0) {
  // Table doesn't exist yet — create it fresh
  db.exec(`
    CREATE TABLE chat_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT,
      step        INTEGER NOT NULL,
      user_msg    TEXT    NOT NULL,
      ai_reply    TEXT    NOT NULL,
      model_used  TEXT    NOT NULL DEFAULT 'none',
      source      TEXT    NOT NULL DEFAULT 'web',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON chat_logs(session_id);
  `);
} else if (!hasSessionId) {
  // Old schema (user_id based) — drop and recreate (dev data is disposable)
  db.exec(`
    DROP TABLE chat_logs;
    CREATE TABLE chat_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT,
      step        INTEGER NOT NULL,
      user_msg    TEXT    NOT NULL,
      ai_reply    TEXT    NOT NULL,
      model_used  TEXT    NOT NULL DEFAULT 'none',
      source      TEXT    NOT NULL DEFAULT 'web',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON chat_logs(session_id);
  `);
  console.log('[DB] Migrated chat_logs to session-based schema');
}
// else: already has session_id — nothing to do

export default db;
