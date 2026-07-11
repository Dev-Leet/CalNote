import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getGoogleConsent, googleOAuthCallback, unlinkGoogle } from './google.controller';

const router = Router();

// requireAuth: the user must already be logged into CP Calendar Pro before
// starting the Google linking flow — this is an account-linking action, not
// a login mechanism itself.
router.get('/consent', requireAuth, getGoogleConsent);

// No requireAuth here — Google redirects the browser directly to this route
// with no Authorization header attached. Identity is recovered via the
// state-token lookup instead (see google.controller.ts).
router.get('/callback', googleOAuthCallback);

router.post('/unlink', requireAuth, unlinkGoogle);

export default router;