// apps/api/src/config/passport.ts
// Passport.js Google OAuth 2.0 strategy configuration

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { config } from './env';
import { authService } from '../services/authService';
import { logger } from './logger';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const user = await authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken: refreshToken ?? undefined,
          });
          done(null, user);
        } catch (error) {
          logger.error('Google OAuth strategy error:', error);
          done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user ID into session
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { id: string }).id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authService.getUserById(id);
      done(null, user ?? undefined);
    } catch (error) {
      done(error, undefined);
    }
  });
}
