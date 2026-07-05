// apps/api/src/server.ts
// Server entry point — binds app to port and starts background jobs

import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, redis } from './config/redis';
import { initCronJobs } from './cron';

async function bootstrap(): Promise<void> {
  // Connect to infrastructure
  await connectDatabase();
  await connectRedis();

  const server = app.listen(config.port, () => {
    logger.info(`⚡ Server running on http://localhost:${config.port}`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Frontend URL: ${config.frontendUrl}`);
  });

  // Start background jobs (contest scraping cron)
  initCronJobs();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      await redis.quit();
      logger.info('Server shut down cleanly');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcing exit');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
