// src/validators/products.validator.js
import { z } from 'zod';

const productStatuses = ['available', 'ending_soon', 'closed', 'sold_out'];

export const productInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category_id: z.string().uuid(),
  photo_url: z.string().url().optional(),
  normal_price: z.number().int(),
  discount_price: z.number().int(),
  stock: z.number().int().min(0),
  sale_start_at: z.string().datetime({ offset: true }),
  order_deadline_at: z.string().datetime({ offset: true }),
  pickup_deadline_at: z.string().datetime({ offset: true }),
}).strict().superRefine((product, context) => {
  if (product.discount_price > product.normal_price) {
    context.addIssue({ code: 'custom', path: ['discount_price'], message: 'Harga diskon tidak boleh melebihi harga normal.' });
  }

  const saleStart = Date.parse(product.sale_start_at);
  const orderDeadline = Date.parse(product.order_deadline_at);
  const pickupDeadline = Date.parse(product.pickup_deadline_at);
  if (!(saleStart < orderDeadline && orderDeadline <= pickupDeadline)) {
    context.addIssue({ code: 'custom', path: ['order_deadline_at'], message: 'Urutan batas waktu produk tidak valid.' });
  }
});
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

export const sellerProductsQuerySchema = z.object({
  status: z.enum(productStatuses).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
