import { Router, Request, Response } from 'express';
import db from '../config/database';
import { getModelResolutionStatus } from '../services/qiniuService';
import type { GlobalStatsRow } from '../types';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const deepModel = getModelResolutionStatus();
  res.json({
    status: deepModel.error ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    deepModel,
  });
});

router.get('/stats', (_req: Request, res: Response) => {
  const stats = db.prepare('SELECT * FROM global_stats WHERE id = 1').get() as GlobalStatsRow;
  res.json({
    success: true,
    data: {
      totalAsks: stats.total_asks,
      dailyApiCount: stats.daily_api_count,
    },
  });
});

export default router;
