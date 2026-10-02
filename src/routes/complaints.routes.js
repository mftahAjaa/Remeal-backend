// src/routes/complaints.routes.js
import { Router } from 'express';
import * as complaintsController from '../controllers/complaints.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createComplaintSchema } from '../validators/complaints.validator.js';

const router = Router();

router.post(
  '/complaints',
  requireAuth,
  requireRole('consumer', 'seller'),
  validate(createComplaintSchema),
  complaintsController.createComplaint,
);

export default router;