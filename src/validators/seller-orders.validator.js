// src/validators/seller-orders.validator.js
import { z } from 'zod';

const orderStatuses = [
  'pending_payment',
  'paid',
  'confirmed',
  'completed',
  'cancelled',
  'expired',
];

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

export const sellerOrderParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export const sellerOrdersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  date: calendarDateSchema.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const verifyQrSchema = z.object({
  qr_code: z.string().trim().min(1),
});