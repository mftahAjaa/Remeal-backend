// src/validators/payment.validator.js
import { z } from 'zod';

export const orderIdParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export const createPaymentSchema = z.object({
  method: z.enum(['qris', 'virtual_account', 'ewallet']),
});