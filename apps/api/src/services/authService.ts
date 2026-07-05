// apps/api/src/services/authService.ts
// Authentication business logic

import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { generateToken } from '../middlewares/authMiddleware';

interface GoogleUserInput {
  googleId: string;
  email: string;
  name?: string;
  profilePicture?: string;
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  /**
   * Find or create a user from Google OAuth profile
   */
  async findOrCreateGoogleUser(input: GoogleUserInput): Promise<User> {
    try {
      // Try to find existing user by googleId
      let user = await prisma.user.findUnique({
        where: { googleId: input.googleId },
      });

      if (user) {
        // Update tokens and last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            accessToken: input.accessToken,
            refreshToken: input.refreshToken ?? user.refreshToken,
            lastLoginAt: new Date(),
            name: input.name ?? user.name,
            profilePicture: input.profilePicture ?? user.profilePicture,
          },
        });
      } else {
        // Check if user exists by email (different OAuth provider)
        const existingByEmail = await prisma.user.findUnique({
          where: { email: input.email },
        });

        if (existingByEmail) {
          user = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              googleId: input.googleId,
              accessToken: input.accessToken,
              refreshToken: input.refreshToken,
              lastLoginAt: new Date(),
              name: input.name ?? existingByEmail.name,
              profilePicture: input.profilePicture ?? existingByEmail.profilePicture,
            },
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              googleId: input.googleId,
              email: input.email,
              name: input.name,
              profilePicture: input.profilePicture,
              accessToken: input.accessToken,
              refreshToken: input.refreshToken,
              lastLoginAt: new Date(),
              timezone: 'Asia/Kolkata',
            },
          });
          logger.info(`New user created: ${user.email}`);
        }
      }

      return user;
    } catch (error) {
      logger.error('findOrCreateGoogleUser error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Generate a new access token from refresh token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return generateToken(user.id, user.email);
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    settings: Partial<{
      timezone: string;
      notifyBefore5Min: boolean;
      notifyBefore15Min: boolean;
      notifyBefore1Hour: boolean;
      notifyBefore1Day: boolean;
      enabledPlatforms: Record<string, boolean>;
    }>
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: settings,
    });
  }

  /**
   * Delete user account (cascades to notes and synced contests)
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
    logger.info(`User ${userId} account deleted`);
  }
}

export const authService = new AuthService();
