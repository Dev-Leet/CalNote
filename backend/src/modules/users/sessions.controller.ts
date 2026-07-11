import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../../models/User.model';
import { AppError } from '../../utils/AppError';

interface PublicSession {
  deviceId: string;
  issuedAt: string;
  expiresAt: string;
}

export async function listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.userId).select('refreshTokens');
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    // Only expose non-revoked, non-expired sessions — a revoked/expired
    // token is not a "session" from the user's point of view, and tokenHash
    // itself is never included, since it's a credential, not display data.
    const now = new Date();
    const sessions: PublicSession[] = user.refreshTokens
      .filter((t) => !t.revoked && t.expiresAt > now)
      .map((t) => ({
        deviceId: t.deviceId,
        issuedAt: t.issuedAt.toISOString(),
        expiresAt: t.expiresAt.toISOString(),
      }));

    res.status(200).json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId } = req.params;

    const result = await UserModel.updateOne(
      { _id: req.user!.userId, 'refreshTokens.deviceId': deviceId },
      { $set: { 'refreshTokens.$.revoked': true } },
    );

    if (result.matchedCount === 0) {
      throw new AppError('NOT_FOUND', 404, 'Session not found');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}