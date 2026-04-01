import app from './app';
import { env } from './config/env';
import cron from 'node-cron';
import db from './config/database';
import fs from 'fs';
import path from 'path';

// Daily reset of API count at midnight
cron.schedule('0 0 * * *', () => {
  db.prepare('UPDATE global_stats SET daily_api_count = 0, last_reset_date = date("now") WHERE id = 1').run();
  console.log('[CRON] Daily API count reset');
});

// Data cleanup on April 2nd (backup + wipe sessions & logs)
cron.schedule('0 0 2 4 *', () => {
  const now = new Date();
  if (now.getFullYear() === 2026) {
    try {
      const dbPath = path.resolve(env.dbPath);
      const backupPath = path.resolve(path.dirname(dbPath), `backup_${Date.now()}.db`);
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
      }
      db.prepare('DELETE FROM chat_logs').run();
      db.prepare('DELETE FROM sessions').run();
      console.log('[CRON] Session data cleaned up successfully');
    } catch (err) {
      console.error('[CRON] Cleanup failed:', err);
    }
  }
});

app.listen(env.port, () => {
  console.log(`🚀 Server running on http://localhost:${env.port}`);
  console.log(`📅 Event ends: ${env.eventEndDate}`);
  console.log(`🔑 Environment: ${env.nodeEnv}`);
});
