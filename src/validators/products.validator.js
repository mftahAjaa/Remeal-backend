// src/validators/products.validator.js
import { z } from 'zod';

export const productIdParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const productsQuerySchema = z.object({
  q: z.string().trim().optional(),
  category_id: z.string().uuid().optional(),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
  min_rating: z.coerce.number().min(1).max(5).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().optional(),
  sort: z.enum(['nearest', 'almost_gone', 'cheapest', 'highest_rating', 'ending_soon']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).refine((filters) => (filters.latitude === undefined) === (filters.longitude === undefined))
  .refine((filters) => filters.min_price === undefined || filters.max_price === undefined || filters.min_price <= filters.max_price);