/**
 * Shared refresh-cookie config, extracted so auth.controller.ts (email/password
 * + Google sign-in) and any future auth method all issue identical cookies —
 * previously these constants lived only inside auth.controller.ts; Google
 * sign-in needs the exact same cookie contract, so this avoids a second
 * hand-copied definition that could silently drift (different maxAge, etc.).
 */
export const REFRESH_COOKIE_NAME = 'refreshToken';

export const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};