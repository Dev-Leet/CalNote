import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { authService } from './auth.service';
import { UserModel } from '../../models/User.model';
import { AppError } from '../../utils/AppError';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTS } from './authCookies';

function toPublicUser(user: { _id: unknown; email: string; role: 'user' | 'admin' }) {
  return { id: user._id, email: user.email, role: user.role };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new AppError('EMAIL_EXISTS', 409, 'An account with this email already exists');
    }

    const passwordHash = await authService.hashPassword(password);
    const user = await UserModel.create({ email, passwordHash, authProvider: 'local' });

    const deviceId = crypto.randomUUID();
    const refreshToken = await authService.issueRefreshToken(user, deviceId);
    const accessToken = authService.generateAccessToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ user: toPublicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await UserModel.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const valid = await authService.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const deviceId = crypto.randomUUID();
    const refreshToken = await authService.issueRefreshToken(user, deviceId);
    const accessToken = authService.generateAccessToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({ user: toPublicUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      throw new AppError('REFRESH_TOKEN_INVALID_OR_REVOKED', 401, 'No refresh token provided');
    }

    const deviceId = crypto.randomUUID();
    const { tokens } = await authService.rotateRefreshToken(rawToken, deviceId);

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await authService.revokeRefreshToken(rawToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
