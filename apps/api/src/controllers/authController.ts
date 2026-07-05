// apps/api/src/controllers/authController.ts
// Authentication HTTP handlers

import { Request, Response } from 'express';
import { AuthRequest, generateToken } from '../middlewares/authMiddleware';
import { authService } from '../services/authService';
import { config } from '../config/env';
import { logger } from '../config/logger';

class AuthController {
  /** Redirect to Google OAuth consent screen */
  googleAuth(req: Request, res: Response): void {
    res.redirect('/api/v1/auth/google/redirect');
  }

  /** Handle Google OAuth callback — issue JWT and redirect to frontend */
  async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string } | undefined;
      if (!user) {
        res.redirect(`${config.frontendUrl}/auth/callback?error=auth_failed`);
        return;
      }

      const token = generateToken(user.id, user.email);
      res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      logger.error('handleGoogleCallback error:', error);
      res.redirect(`${config.frontendUrl}/auth/callback?error=auth_failed`);
    }
  }

  /** GET /auth/me — return current authenticated user */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await authService.getUserById(req.user!.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Strip sensitive fields
      const { accessToken, refreshToken, ...safeUser } = user;
      void accessToken; void refreshToken;

      res.json({ success: true, data: safeUser });
    } catch (error) {
      logger.error('getCurrentUser error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  }

  /** POST /auth/logout */
  logout(req: AuthRequest, res: Response): void {
    // JWT is stateless — client should delete the token
    // Optionally could blacklist in Redis here
    res.json({ success: true, message: 'Logged out successfully' });
  }

  /** GET /auth/settings */
  async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await authService.getUserById(req.user!.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          timezone: user.timezone,
          notifyBefore5Min: user.notifyBefore5Min,
          notifyBefore15Min: user.notifyBefore15Min,
          notifyBefore1Hour: user.notifyBefore1Hour,
          notifyBefore1Day: user.notifyBefore1Day,
          enabledPlatforms: user.enabledPlatforms,
        },
      });
    } catch (error) {
      logger.error('getSettings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  }

  /** PUT /auth/settings */
  async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const updated = await authService.updateSettings(req.user!.userId, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('updateSettings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }

  /** DELETE /auth/account */
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      await authService.deleteUser(req.user!.userId);
      res.status(204).send();
    } catch (error) {
      logger.error('deleteAccount error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
  }
}

export const authController = new AuthController();
