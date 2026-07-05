// apps/api/src/config/logger.ts
// Winston structured logger

import winston from 'winston';
import { config } from './env';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
  level: config.logLevel,
  format: config.isDev ? devFormat : prodFormat,
  defaultMeta: { service: 'cp-calendar-api' },
  transports: [
    new winston.transports.Console(),
    ...(config.isProd
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

// Suppress console logs during testing
if (config.nodeEnv === 'test') {
  logger.silent = true;
}
