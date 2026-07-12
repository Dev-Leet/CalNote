import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getGoogleConsentUrl, createGoogleOAuthClient, verifyGoogleIdToken } from '../../config/google';
import { googleCalendarSyncService } from '../events/googleCalendar.sync';
import { redisClient } from '../../config/redis';
import { UserModel } from '../../models/User.model';
import { authService } from './auth.service';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTS } from './authCookies';
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
 * "Sign in with Google" — a completely separate flow from consent/callback
 * above. Those use the OAuth authorization-code flow (requires an already
 * logged-in user, grants Calendar API scope). This uses ID-token
 * verification (Google Identity Services' one-step client-side flow) purely
 * to establish IDENTITY — no Calendar scope is requested or granted here.
 *
 * Find-or-create logic, in priority order:
 *   1. Match by googleId (returning Google sign-in)
 *   2. Match by verified email (a local-password user signing in with Google
 *      for the first time) -> link googleId to that existing account
 *   3. No match -> create a new account with authProvider: 'google'
 */
export async function googleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body as { idToken: string };

    const identity = await verifyGoogleIdToken(idToken);

    if (!identity.email || !identity.emailVerified) {
      throw new AppError('INVALID_GOOGLE_TOKEN', 401, "Google account's email is not verified");
    }

    let user = await UserModel.findOne({ googleId: identity.sub });

    if (!user) {
      user = await UserModel.findOne({ email: identity.email });
      if (user) {
        user.googleId = identity.sub;
        // validateModifiedOnly: only re-validates the `googleId` path we
        // actually changed, rather than the whole document — a legacy or
        // externally-inserted document with pre-existing invalid fields
        // (missing authProvider/timezone, bad role enum, etc.) would
        // otherwise fail validation on THOSE untouched fields and block
        // an otherwise-unrelated googleId link. This treats the symptom
        // safely; it does NOT fix bad data already sitting in MongoDB —
        // if `role: "farmer"` is real data, that document still needs a
        // manual DB fix/migration, this just stops it from crashing sign-in.
        await user.save({ validateModifiedOnly: true });
      }
    }

    if (!user) {
      user = await UserModel.create({
        email: identity.email,
        authProvider: 'google',
        googleId: identity.sub,
      });
    }

    const deviceId = crypto.randomUUID();
    const refreshToken = await authService.issueRefreshToken(user, deviceId);
    const accessToken = authService.generateAccessToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({
      user: { id: user._id, email: user.email, role: user.role },
      accessToken,
    });
  } catch (err) {
    logger.error({ err }, 'Google sign-in failed');
    next(err instanceof AppError ? err : new AppError('INVALID_GOOGLE_TOKEN', 401, 'Google sign-in failed'));
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