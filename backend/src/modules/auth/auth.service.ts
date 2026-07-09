import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserModel, IUser } from '../../models/User.model';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;
const BCRYPT_ROUNDS = 12;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined');
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string; // raw token — caller sets as httpOnly cookie, never persisted raw
}

interface AccessTokenPayload {
  sub: string; // userId
  role: 'user' | 'admin';
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export class AuthService {
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  generateAccessToken(user: IUser): string {
    const payload: AccessTokenPayload = { sub: user._id.toString(), role: user.role };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    } catch {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired access token');
    }
  }

  /**
   * Issues a new refresh token, persists its HASH (never the raw token) on the
   * user document alongside device metadata, and returns the raw token to be
   * set as an httpOnly cookie.
   */
  async issueRefreshToken(user: IUser, deviceId: string): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    user.refreshTokens.push({ tokenHash, deviceId, issuedAt, expiresAt, revoked: false });
    await user.save();

    return rawToken;
  }

  /**
   * Validates a raw refresh token against stored hashes, rotates it (marks old
   * as revoked, issues new), and returns a fresh TokenPair. Detects reuse of an
   * already-revoked token as a signal of possible token theft and revokes ALL
   * sessions for the user as a precaution.
   */
  async rotateRefreshToken(rawToken: string, deviceId: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const tokenHash = hashToken(rawToken);
    const user = await UserModel.findOne({ 'refreshTokens.tokenHash': tokenHash });

    if (!user) {
      throw new AppError('REFRESH_TOKEN_INVALID_OR_REVOKED', 401, 'Refresh token not recognized');
    }

    const tokenEntry = user.refreshTokens.find((t) => t.tokenHash === tokenHash);

    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      throw new AppError('REFRESH_TOKEN_INVALID_OR_REVOKED', 401, 'Refresh token expired');
    }

    if (tokenEntry.revoked) {
      // Reuse of a revoked token — likely theft. Revoke everything.
      logger.warn({ userId: user._id.toString() }, 'Revoked refresh token reuse detected — revoking all sessions');
      user.refreshTokens.forEach((t) => (t.revoked = true));
      await user.save();
      throw new AppError('REFRESH_TOKEN_INVALID_OR_REVOKED', 401, 'Refresh token reuse detected');
    }

    tokenEntry.revoked = true;
    const newRawRefreshToken = await this.issueRefreshToken(user, deviceId);
    const newAccessToken = this.generateAccessToken(user);
    await user.save();

    return {
      user,
      tokens: { accessToken: newAccessToken, refreshToken: newRawRefreshToken },
    };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await UserModel.updateOne(
      { 'refreshTokens.tokenHash': tokenHash },
      { $set: { 'refreshTokens.$.revoked': true } },
    );
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { 'refreshTokens.$[].revoked': true } },
    );
  }
}

export const authService = new AuthService();
