// apps/api/src/app.ts
// Express application setup

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/logger';
import { configurePassport } from './config/passport';
import routes from './routes';

const app: Express = express();

// ─────────────────────────────────────────────
// Security Headers
// ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: config.isProd,
    crossOriginEmbedderPolicy: false,
  })
);

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────
// Compression & Body parsing
// ─────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────
// Session (needed for Passport)
// ─────────────────────────────────────────────
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProd,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// ─────────────────────────────────────────────
// Passport OAuth
// ─────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ─────────────────────────────────────────────
// Request logging
// ─────────────────────────────────────────────
app.use(requestLogger);

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/v1', routes);

// ─────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─────────────────────────────────────────────
// Global error handler (must be last)
// ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
