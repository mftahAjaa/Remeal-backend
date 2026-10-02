// src/routes/products.routes.js
import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';
import { validate } from '../middleware/validate.js';
import { productIdParamsSchema, productsQuerySchema } from '../validators/products.validator.js';

const router = Router();

router.get('/products', validate(productsQuerySchema, 'query'), productsController.searchProducts);
router.get(
  '/products/:productId',
  validate(productIdParamsSchema, 'params'),
  productsController.getProduct,
);

export default router;