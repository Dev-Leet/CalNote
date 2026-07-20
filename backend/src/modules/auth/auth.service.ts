import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
   * Issues a new refresh token and persists its HASH via an atomic $push,
   * NOT load-mutate-save. This deliberately does not touch the passed-in
   * `user` document's own version state — using user.save() here (as the
   * previous implementation did) meant every caller that ALSO calls
   * user.save() on the same document within one request (rotateRefreshToken
   * did exactly this) raced against itself: two saves on one in-memory
   * document, each bumping Mongoose's optimistic-concurrency version,
   * where the second save could find the version already stale if any
   * other request touched the same user in between — producing the
   * VersionError seen under concurrent/rapid refresh calls (e.g. two tabs,
   * or React StrictMode's dev-mode double-invoke). An atomic update has no
   * such race: it either succeeds against whatever the current DB state is,
   * or (extremely rarely) is a no-op — never a version conflict.
   */
  async issueRefreshToken(user: IUser, deviceId: string): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await UserModel.updateOne(
      { _id: user._id },
      { $push: { refreshTokens: { tokenHash, deviceId, issuedAt, expiresAt, revoked: false } } },
    );

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
      logger.warn({ userId: user._id.toString() }, 'Revoked refresh token reuse detected — revoking all sessions');
      // Atomic positional-array update instead of load-mutate-save, same
      // rationale as issueRefreshToken above — no version race possible.
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { 'refreshTokens.$[].revoked': true } },
      );
      throw new AppError('REFRESH_TOKEN_INVALID_OR_REVOKED', 401, 'Refresh token reuse detected');
    }

    // Atomic positional update targeting the exact matched array element by
    // tokenHash, avoiding the load-mutate-save race entirely — this and the
    // $push inside issueRefreshToken() (called next) are now the ONLY two
    // writes involved, both atomic, both independent of each other's
    // document version.
    await UserModel.updateOne(
      { _id: user._id, 'refreshTokens.tokenHash': tokenHash },
      { $set: { 'refreshTokens.$.revoked': true } },
    );

    const newRawRefreshToken = await this.issueRefreshToken(user, deviceId);
    const newAccessToken = this.generateAccessToken(user);

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
