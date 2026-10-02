// src/validators/stores.validator.js
import { z } from 'zod';

const latitudeSchema = z.coerce.number().min(-90).max(90).optional();
const longitudeSchema = z.coerce.number().min(-180).max(180).optional();

export const storeIdParamsSchema = z.object({
  storeId: z.string().uuid(),
});

export const storesQuerySchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  radius_km: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).refine(({ latitude, longitude }) => (latitude === undefined) === (longitude === undefined));

export const storeReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});