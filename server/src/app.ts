import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { ipBanMiddleware } from './middleware/ipBan';
import { eventCheckMiddleware } from './middleware/eventCheck';
import { globalLimiter, authLimiter, chatLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import apiV1Routes from './routes/apiV1';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(globalLimiter);
app.use(ipBanMiddleware);

// Health routes (no event check)
app.use('/api', healthRoutes);

// Event check for all other API routes
app.use('/api', eventCheckMiddleware);

// Auth routes
app.use('/api/auth', authLimiter, authRoutes);

// User routes
app.use('/api/user', userRoutes);

// Chat routes
app.use('/api/chat', chatLimiter, chatRoutes);

// API v1 routes (external)
app.use('/api/v1', chatLimiter, apiV1Routes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } });
});

export default app;
