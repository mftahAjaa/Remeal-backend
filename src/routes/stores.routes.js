// src/routes/stores.routes.js
import { Router } from 'express';
import * as storesController from '../controllers/stores.controller.js';
import { validate } from '../middleware/validate.js';
import {
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
router.get(
  '/stores/:storeId',
  validate(storeIdParamsSchema, 'params'),
  storesController.getStore,
);

export default router;