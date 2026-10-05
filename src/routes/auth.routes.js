// src/routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/auth/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/logout', requireAuth, authController.logout);
router.post('/auth/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;