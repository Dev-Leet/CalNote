import { Router } from 'express';
//import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';
import { register, login, refresh, logout } from './auth.controller';
import  { registerSchema, loginSchema } from './auth.validation';

const router = Router();


router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
