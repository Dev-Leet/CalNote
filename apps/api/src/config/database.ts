// apps/api/src/config/database.ts
// Prisma client singleton re-export

import { PrismaClient } from '@prisma/client';
import { config } from './env';

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

export const prisma =
  global._prisma ??
  new PrismaClient({
    log: config.isDev ? ['query', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });

if (config.isDev) {
  global._prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}
