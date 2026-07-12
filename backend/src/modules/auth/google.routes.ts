import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';
import { getGoogleConsent, googleOAuthCallback, unlinkGoogle, googleSignIn } from './google.controller';

const router = Router();

// No requireAuth — this IS the login mechanism. Rate-limited the same as
// email/password login to prevent ID-token brute-forcing attempts, even
// though verifyGoogleIdToken already rejects anything not signed by Google.
const googleSignInSchema = z.object({
  idToken: z.string().min(1),
});
router.post('/signin', authRateLimiter, validate(googleSignInSchema), googleSignIn);

// requireAuth: the user must already be logged into CP Calendar Pro before
// starting the Google Calendar linking flow — this is an account-linking
// action, not a login mechanism.
router.get('/consent', requireAuth, getGoogleConsent);

// No requireAuth here — Google redirects the browser directly to this route
// with no Authorization header attached. Identity is recovered via the
// state-token lookup instead (see google.controller.ts).
router.get('/callback', googleOAuthCallback);

router.post('/unlink', requireAuth, unlinkGoogle);

export default router;