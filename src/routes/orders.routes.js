// src/routes/orders.routes.js
import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  orderIdParamsSchema,
  ordersQuerySchema,
} from '../validators/orders.validator.js';

const router = Router();
const requireConsumer = [requireAuth, requireRole('consumer')];

router.post(
  '/orders',
  ...requireConsumer,
  validate(createOrderSchema),
  ordersController.createOrder,
);
router.get(
  '/orders',
  ...requireConsumer,
  validate(ordersQuerySchema, 'query'),
  ordersController.listOrders,
);
router.post(
  '/orders/:orderId/cancel',
  ...requireConsumer,
  validate(orderIdParamsSchema, 'params'),
  ordersController.cancelOrder,
);
router.get(
  '/orders/:orderId',
  ...requireConsumer,
  validate(orderIdParamsSchema, 'params'),
  ordersController.getOrder,
);

export default router;