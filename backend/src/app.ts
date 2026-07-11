import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import eventRoutes from './modules/events/event.routes';
import contestRoutes from './modules/contests/contest.routes';
import notesRoutes from './modules/notes/notes.routes';
import aiRoutes from './modules/ai/ai.routes';
import googleRoutes from './modules/auth/google.routes';
import sessionsRoutes from './modules/users/sessions.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { globalApiRateLimiter } from './middleware/rateLimit.middleware';

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
  app.use('/api/v1', globalApiRateLimiter);

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/auth/google', googleRoutes);
  app.use('/api/v1/users/me/sessions', sessionsRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/contests', contestRoutes);
  app.use('/api/v1/notes', notesRoutes);
  app.use('/api/v1/ai', aiRoutes);
  
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
