import 'dotenv/config';
import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { connectRedis } from './config/redis';
import { startContestCron, stopContestCron } from './modules/contests/contest.cron';
import { logger } from './utils/logger';

const PORT = process.env.PORT ?? 4000;

async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();
  await startContestCron();

  const app = createApp();
  const server = app.listen(PORT, () => {
    logger.info(`CP Calendar Pro API listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close();
    await stopContestCron();
    await disconnectDB();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
