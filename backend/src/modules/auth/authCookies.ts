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
  // 'none' is REQUIRED for cross-site cookies (frontend and backend on
  // different domains, e.g. pages.dev vs onrender.com) — 'lax' blocks the
  // cookie on the axios-based fetch calls this app makes to /auth/refresh
  // from a different origin, which only worked in local dev because both
  // ran on localhost (same-site by the browser's definition). 'none'
  // REQUIRES secure: true — browsers reject SameSite=None cookies over
  // plain HTTP, so this pairing only works because both Render and
  // Cloudflare Pages serve over HTTPS by default.
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};