// src/routes/reviews.routes.js
import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createReviewSchema,
  orderIdParamsSchema,
  reportReviewSchema,
  reviewIdParamsSchema,
  updateReviewSchema,
} from '../validators/reviews.validator.js';

const router = Router();

router.post(
  '/orders/:orderId/review',
  requireAuth,
  requireRole('consumer'),
  validate(orderIdParamsSchema, 'params'),
  validate(createReviewSchema),
  reviewsController.createReview,
);
router.patch(
  '/reviews/:reviewId',
  requireAuth,
  requireRole('consumer'),
  validate(reviewIdParamsSchema, 'params'),
  validate(updateReviewSchema),
  reviewsController.updateReview,
);
router.post(
  '/reviews/:reviewId/report',
  requireAuth,
  requireRole('consumer', 'seller'),
  validate(reviewIdParamsSchema, 'params'),
  validate(reportReviewSchema),
  reviewsController.reportReview,
);

export default router;