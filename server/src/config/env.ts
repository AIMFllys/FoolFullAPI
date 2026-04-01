import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['QINIU_API_URL', 'QINIU_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ 缺少必需的环境变量: ${key}`);
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || './data/database.db',
  qiniuApiUrl: process.env.QINIU_API_URL!,
  qiniuApiKey: process.env.QINIU_API_KEY!,
  kimiModel: process.env.KIMI_MODEL || 'moonshot-v1-auto',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  maxAskPerSession: parseInt(process.env.MAX_ASK_PER_SESSION || '18', 10),
  maxDailyApiCalls: parseInt(process.env.MAX_DAILY_API_CALLS || '1000', 10),
  ipBanThreshold: parseInt(process.env.IP_BAN_THRESHOLD || '50', 10),
  ipBanDurationMinutes: parseInt(process.env.IP_BAN_DURATION_MINUTES || '30', 10),
  eventEndDate: process.env.EVENT_END_DATE || '2026-04-02T00:00:00+08:00',
  masterApiKey: process.env.MASTER_API_KEY || '', // Optional: if set, required for /api/v1
};
