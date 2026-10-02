// src/validators/complaints.validator.js
import { z } from 'zod';

export const createComplaintSchema = z.object({
  order_id: z.string().uuid().optional(),
  subject: z.string().trim().min(1),
  description: z.string().trim().min(1),
}).strict();