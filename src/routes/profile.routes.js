// src/routes/profile.routes.js
import { Router } from 'express';
import * as profileController from '../controllers/me.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profile.validator.js';

const router = Router();

router.get('/me', requireAuth, profileController.getMyProfile);
router.patch('/me', requireAuth, validate(updateProfileSchema), profileController.updateMyProfile);

export default router;