// src/routes/stores.routes.js
import { Router } from 'express';
import * as storesController from '../controllers/stores.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  storeInputSchema,
  storeIdParamsSchema,
  storeReviewsQuerySchema,
  storesQuerySchema,
} from '../validators/stores.validator.js';

const router = Router();

router.get('/stores', validate(storesQuerySchema, 'query'), storesController.listStores);
router.get(
  '/stores/:storeId/reviews',
  validate(storeIdParamsSchema, 'params'),
  validate(storeReviewsQuerySchema, 'query'),
  storesController.listStoreReviews,
);
router.get('/stores/me', requireAuth, requireRole('seller'), storesController.getMyStore);
router.patch(
  '/stores/me',
  requireAuth,
  requireRole('seller'),
  validate(storeInputSchema),
  storesController.updateMyStore,
);
router.get(
  '/stores/:storeId',
  validate(storeIdParamsSchema, 'params'),
  storesController.getStore,
);
router.post('/stores', requireAuth, requireRole('seller'), validate(storeInputSchema), storesController.createStore);

export default router;