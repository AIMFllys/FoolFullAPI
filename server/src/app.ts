import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { ipBanMiddleware } from './middleware/ipBan';
import { eventCheckMiddleware } from './middleware/eventCheck';
import { globalLimiter, chatLimiter } from './middleware/rateLimiter';
import chatRoutes from './routes/chat';
import apiV1Routes from './routes/apiV1';
import healthRoutes from './routes/health';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(globalLimiter);
app.use(ipBanMiddleware);

app.use('/api', healthRoutes);
app.use('/api', eventCheckMiddleware);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/v1', chatLimiter, apiV1Routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } });
});

export default app;
