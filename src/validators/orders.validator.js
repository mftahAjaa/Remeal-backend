// src/validators/orders.validator.js
import { z } from 'zod';

const orderStatuses = [
  'pending_payment',
  'paid',
  'confirmed',
  'completed',
  'cancelled',
  'expired',
];

export const orderIdParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export const createOrderSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
}).strict();

export const ordersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});