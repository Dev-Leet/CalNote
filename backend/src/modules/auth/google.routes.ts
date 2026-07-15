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

// NOT requireAuth: this route is reached via a full browser navigation,
// which cannot carry the Authorization header requireAuth checks for.
// getGoogleConsent identifies the user via the refresh cookie instead —
// see the detailed comment on that function.
router.get('/consent', getGoogleConsent);

// No requireAuth here — Google redirects the browser directly to this route
// with no Authorization header attached. Identity is recovered via the
// state-token lookup instead (see google.controller.ts).
router.get('/callback', googleOAuthCallback);

router.post('/unlink', requireAuth, unlinkGoogle);

export default router;