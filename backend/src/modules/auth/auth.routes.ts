import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validate } from '../../middleware/validate.middleware';
import { authService } from './auth.service';
import { UserModel } from '../../models/User.model';
import { AppError } from '../../utils/AppError';

const router = Router();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const existing = await UserModel.findOne({ email });
    if (existing) throw new AppError('EMAIL_EXISTS', 409, 'An account with this email already exists');

    const passwordHash = await authService.hashPassword(password);
    const user = await UserModel.create({ email, passwordHash, authProvider: 'local' });

    const deviceId = crypto.randomUUID();
    const refreshToken = await authService.issueRefreshToken(user, deviceId);
    const accessToken = authService.generateAccessToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const valid = await authService.verifyPassword(password, user.passwordHash);
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');

    const deviceId = crypto.randomUUID();
    const refreshToken = await authService.issueRefreshToken(user, deviceId);
    const accessToken = authService.generateAccessToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({ user: { id: user._id, email: user.email, role: user.role }, accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) throw new AppError('REFRESH_TOKEN_INVALID_OR_REVOKED', 401, 'No refresh token provided');

    const deviceId = crypto.randomUUID();
    const { tokens } = await authService.rotateRefreshToken(rawToken, deviceId);

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) await authService.revokeRefreshToken(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
