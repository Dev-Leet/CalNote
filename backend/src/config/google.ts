import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error('Google OAuth env vars (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI) are not fully defined');
}

// Scope minimized to calendar.events only, per HLD Section 1.5.
export const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export function createGoogleOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export function getGoogleConsentUrl(state: string): string {
  const client = createGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline', // required to receive a refresh_token
    prompt: 'consent',
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
  });
}

/**
 * Builds an authorized Calendar API client for a specific user, using their
 * stored refresh token. googleapis handles access-token refresh internally
 * once the refresh_token is set on the OAuth2Client credentials.
 */
export function getAuthorizedCalendarClient(googleRefreshToken: string) {
  const client = createGoogleOAuthClient();
  client.setCredentials({ refresh_token: googleRefreshToken });
  return google.calendar({ version: 'v3', auth: client });
}

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
}

/**
 * Verifies a Google ID token (obtained client-side via Google Identity
 * Services) against Google's public keys and this app's own client ID as
 * the expected audience — critical: without the audience check, a token
 * issued for a DIFFERENT app could be replayed here.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
  const client = createGoogleOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google ID token verification returned no payload');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    name: payload.name,
  };
}
