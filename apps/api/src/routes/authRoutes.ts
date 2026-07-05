// apps/api/src/routes/authRoutes.ts
import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: [
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  accessType: 'offline',
  prompt: 'consent',
}));

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google' }),
  (req, res) => authController.handleGoogleCallback(req, res)
);

// Get current user
router.get('/me', requireAuth, (req, res) => authController.getCurrentUser(req as any, res));

// Logout
router.post('/logout', requireAuth, (req, res) => authController.logout(req as any, res));

// Settings
router.get('/settings', requireAuth, (req, res) => authController.getSettings(req as any, res));
router.put('/settings', requireAuth, (req, res) => authController.updateSettings(req as any, res));

// Delete account
router.delete('/account', requireAuth, (req, res) => authController.deleteAccount(req as any, res));

export default router;
