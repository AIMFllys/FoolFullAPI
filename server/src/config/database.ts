import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from './env';

const dbDir = path.dirname(path.resolve(env.dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(env.dbPath));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password      TEXT    NOT NULL,
    api_key       TEXT    UNIQUE,
    step          INTEGER NOT NULL DEFAULT 1,
    ask_count     INTEGER NOT NULL DEFAULT 0,
    is_banned     INTEGER NOT NULL DEFAULT 0,
    is_ide_mode   INTEGER NOT NULL DEFAULT 0,
    first_message TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    step        INTEGER NOT NULL,
    user_msg    TEXT    NOT NULL,
    ai_reply    TEXT    NOT NULL,
    model_used  TEXT    NOT NULL DEFAULT 'none',
    source      TEXT    NOT NULL DEFAULT 'web',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS global_stats (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    total_users     INTEGER NOT NULL DEFAULT 0,
    total_asks      INTEGER NOT NULL DEFAULT 0,
    daily_api_count INTEGER NOT NULL DEFAULT 0,
    last_reset_date TEXT    NOT NULL DEFAULT (date('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
  CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON chat_logs(user_id);

  INSERT OR IGNORE INTO global_stats (id) VALUES (1);
`);

export default db;
