import { Router, Request, Response } from 'express';
import db from '../config/database';
import type { GlobalStatsRow } from '../types';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/stats', (_req: Request, res: Response) => {
  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  res.json({
    success: true,
    data: {
      totalUsers: stats.total_users,
      totalAsks: stats.total_asks,
    },
  });
});

export default router;
