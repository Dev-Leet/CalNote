import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import eventRoutes from './modules/events/event.routes';
import contestRoutes from './modules/contests/contest.routes';
import notesRoutes from './modules/notes/notes.routes';
import aiRoutes from './modules/ai/ai.routes';
import { AppError } from './utils/AppError';
import { logger } from './utils/logger';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/contests', contestRoutes);
  app.use('/api/v1/notes', notesRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/users', userRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found' });
  });

  // Central error-normalization middleware — must be registered last.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ code: err.code, message: err.message, details: err.details });
      return;
    }

    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  });

  return app;
}
