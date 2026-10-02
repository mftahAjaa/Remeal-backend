// src/validators/reviews.validator.js
import { z } from 'zod';

export const orderIdParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export const reviewIdParamsSchema = z.object({
  reviewId: z.string().uuid(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  photo_url: z.string().url().optional(),
}).strict();

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  photo_url: z.string().url().optional(),
}).strict().refine((body) => Object.keys(body).length > 0);

export const reportReviewSchema = z.object({
  reason: z.enum(['inappropriate', 'spam', 'false_information', 'other']),
  description: z.string().optional(),
}).strict();

export const replyReviewSchema = z.object({
  reply: z.string().max(500),
}).strict();