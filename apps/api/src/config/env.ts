// apps/api/src/config/env.ts
// Zod-validated environment configuration

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from repo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/v1/auth/google/callback'),

  // Google Calendar API
  GOOGLE_CALENDAR_API_KEY: z.string().optional(),

  // AI Service
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4-turbo-preview'),

  // Ashna AI (optional)
  ASHNA_AI_API_KEY: z.string().optional(),
  ASHNA_AI_NOTES_AGENT_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Session
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),

  // Encryption key for OAuth tokens
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 chars'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Cron schedule
  SCRAPE_CRON_SCHEDULE: z.string().default('0 */6 * * *'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,

  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,

  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackUrl: env.GOOGLE_CALLBACK_URL,
    calendarApiKey: env.GOOGLE_CALENDAR_API_KEY,
  },

  ai: {
    openaiKey: env.OPENAI_API_KEY,
    model: env.AI_MODEL,
    ashnaKey: env.ASHNA_AI_API_KEY,
    ashnaNotesUrl: env.ASHNA_AI_NOTES_AGENT_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  sessionSecret: env.SESSION_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  frontendUrl: env.FRONTEND_URL,
  logLevel: env.LOG_LEVEL,
  scrapeCronSchedule: env.SCRAPE_CRON_SCHEDULE,
} as const;

export type Config = typeof config;
