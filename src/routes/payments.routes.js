// src/routes/payments.routes.js
import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema, orderIdParamsSchema } from '../validators/payment.validator.js';

const router = Router();

router.post(
  '/orders/:orderId/payment',
  requireAuth,
  requireRole('consumer'),
  validate(orderIdParamsSchema, 'params'),
  validate(createPaymentSchema),
  paymentsController.createPayment,
);
router.post('/payments/webhook', paymentsController.webhook);

export default router;