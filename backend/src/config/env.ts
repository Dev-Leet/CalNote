import 'dotenv/config';
import { z } from 'zod';

/**
 * Centralized, validated environment configuration. Other modules currently
 * read process.env directly (e.g. db.ts, gemini.client.ts) — this file is the
 * recommended single source of truth going forward; existing direct reads
 * still work but should migrate here over time for fail-fast startup validation.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),

  MONGO_URI: z.string().min(1),

  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  FIELD_ENCRYPTION_KEY: z.string().length(64),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),

  GEMINI_API_KEY: z.string().min(1),

  ASHNA_API_KEY: z.string().min(1),
  ASHNA_API_BASE_URL: z.string().url().default('https://api.ashna.ai/v1'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed — see logged field errors above');
  }
  return parsed.data;
}

export const env = loadEnv();
