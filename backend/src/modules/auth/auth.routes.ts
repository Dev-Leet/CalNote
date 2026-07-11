import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';
import { registerSchema, loginSchema } from './auth.validation';
import { register, login, refresh, logout } from './auth.controller';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', authRateLimiter, refresh);
router.post('/logout', logout);

export default router;