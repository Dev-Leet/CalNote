import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getGoogleConsentUrl, createGoogleOAuthClient } from '../../config/google';
import { googleCalendarSyncService } from '../events/googleCalendar.sync';
import { redisClient } from '../../config/redis';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const OAUTH_STATE_PREFIX = 'oauth:google:state:';
const OAUTH_STATE_TTL_SECONDS = 5 * 60; // 5 minutes — matches the previous in-memory expiry window

export async function getGoogleConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = crypto.randomUUID();

    // Redis-backed, TTL-enforced — survives being handled by a different
    // backend instance than the one that processes the callback, unlike the
    // previous in-memory Map which required consent + callback to land on
    // the same process.
    await redisClient.set(`${OAUTH_STATE_PREFIX}${state}`, req.user!.userId, { EX: OAUTH_STATE_TTL_SECONDS });

    const consentUrl = getGoogleConsentUrl(state);
    res.redirect(consentUrl);
  } catch (err) {
    next(err);
  }
}

export async function googleOAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

    if (error) {
      throw new AppError('INVALID_GOOGLE_TOKEN', 401, `Google consent was denied: ${error}`);
    }
    if (!code || !state) {
      throw new AppError('INVALID_GOOGLE_TOKEN', 400, 'Missing code or state in Google callback');
    }

    const userId = await consumeOAuthState(state);
    if (!userId) {
      throw new AppError('INVALID_GOOGLE_TOKEN', 401, 'OAuth state is invalid, expired, or already used');
    }

    const client = createGoogleOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      throw new AppError(
        'INVALID_GOOGLE_TOKEN',
        400,
        'Google did not return a refresh token. Please revoke prior access in your Google Account and try again.',
      );
    }

    await googleCalendarSyncService.linkAccount(userId, tokens.refresh_token);

    logger.info({ userId }, 'Google Calendar linked successfully');

    const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
    res.redirect(`${clientOrigin}/settings?googleLinked=true`);
  } catch (err) {
    next(err);
  }
}

export async function unlinkGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await googleCalendarSyncService.unlinkAccount(req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Atomically reads and deletes the state entry in one round-trip, so two
 * concurrent callback requests (or a client retry) can't both successfully
 * consume the same state token. GETDEL requires Redis >= 6.2; the node-redis
 * client (already a project dependency) supports it natively.
 */
async function consumeOAuthState(state: string): Promise<string | null> {
  const key = `${OAUTH_STATE_PREFIX}${state}`;
  const userId = await redisClient.getDel(key);
  return userId;
}