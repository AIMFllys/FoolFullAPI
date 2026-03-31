import rateLimit from 'express-rate-limit';

const errorResponse = (message: string) => ({
  success: false,
  error: { code: 'RATE_LIMIT', message },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: errorResponse('请求过于频繁，请稍后再试'),
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: errorResponse('登录/注册请求过于频繁，请稍后再试'),
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: errorResponse('消息发送过于频繁，请稍后再试'),
  standardHeaders: true,
  legacyHeaders: false,
});
