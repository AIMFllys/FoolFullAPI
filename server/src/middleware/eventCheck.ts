import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function eventCheckMiddleware(_req: Request, res: Response, next: NextFunction): void {
  if (new Date() >= new Date(env.eventEndDate)) {
    res.status(410).json({
      success: false,
      error: { code: 'EVENT_ENDED', message: '愚人节活动已结束，感谢参与！' },
    });
    return;
  }
  next();
}
