// packages/database/index.ts
// Re-export everything from Prisma client and the singleton instance

export * from '@prisma/client';
export { prisma } from './prisma/client';
