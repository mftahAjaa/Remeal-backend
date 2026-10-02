// src/routes/seller-orders.routes.js
import { Router } from 'express';
import * as sellerOrdersController from '../controllers/seller-orders.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  sellerOrderParamsSchema,
  sellerOrdersQuerySchema,
  verifyQrSchema,
} from '../validators/seller-orders.validator.js';

const router = Router();
const requireSeller = [requireAuth, requireRole('seller')];

router.get(
  '/seller/orders',
  ...requireSeller,
  validate(sellerOrdersQuerySchema, 'query'),
  sellerOrdersController.listOrders,
);
router.post(
  '/seller/orders/verify-qr',
  ...requireSeller,
  validate(verifyQrSchema),
  sellerOrdersController.verifyQr,
);
router.get(
  '/seller/orders/:orderId',
  ...requireSeller,
  validate(sellerOrderParamsSchema, 'params'),
  sellerOrdersController.getOrder,
);
router.post(
  '/seller/orders/:orderId/confirm',
  ...requireSeller,
  validate(sellerOrderParamsSchema, 'params'),
  sellerOrdersController.confirmOrder,
);
router.post(
  '/seller/orders/:orderId/complete',
  ...requireSeller,
  validate(sellerOrderParamsSchema, 'params'),
  sellerOrdersController.completeOrder,
);

export default router;