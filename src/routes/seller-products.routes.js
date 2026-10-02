import { Router } from 'express';
import * as sellerProductsController from '../controllers/seller-products.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  productIdParamsSchema,
  productInputSchema,
  sellerProductsQuerySchema,
} from '../validators/products.validator.js';

const router = Router();
const requireSeller = [requireAuth, requireRole('seller')];

router.get(
  '/seller/products',
  ...requireSeller,
  validate(sellerProductsQuerySchema, 'query'),
  sellerProductsController.listProducts,
);
router.post(
  '/seller/products',
  ...requireSeller,
  validate(productInputSchema),
  sellerProductsController.createProduct,
);
router.patch(
  '/seller/products/:productId',
  ...requireSeller,
  validate(productIdParamsSchema, 'params'),
  validate(productInputSchema),
  sellerProductsController.updateProduct,
);
router.delete(
  '/seller/products/:productId',
  ...requireSeller,
  validate(productIdParamsSchema, 'params'),
  sellerProductsController.deleteProduct,
);
router.post(
  '/seller/products/:productId/close',
  ...requireSeller,
  validate(productIdParamsSchema, 'params'),
  sellerProductsController.closeProduct,
);

export default router;