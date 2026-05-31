import { Router } from 'express';
import {
  postSendCode,
  postRegister,
  postLogin,
  postLoginByCode,
  postLogout,
  getMe,
} from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/send-code', authLimiter, postSendCode);
router.post('/register', authLimiter, postRegister);
router.post('/login', authLimiter, postLogin);
router.post('/login-by-code', authLimiter, postLoginByCode);
router.post('/logout', postLogout);
router.get('/me', requireAuth, getMe);

export default router;
