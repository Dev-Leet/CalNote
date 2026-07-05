// apps/api/src/routes/index.ts
// Central route aggregator

import { Router } from 'express';
import authRoutes from './authRoutes';
import contestRoutes from './contestRoutes';
import noteRoutes from './noteRoutes';
import calendarRoutes from './calendarRoutes';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/contests', contestRoutes);
router.use('/notes', noteRoutes);
router.use('/calendar', calendarRoutes);

// Health check with dependency status
router.get('/health', async (req, res) => {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const status = Object.values(checks).every((v) => v === 'ok') ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
