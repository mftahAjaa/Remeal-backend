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

const businessTypes = ['umkm', 'cafe', 'warung_makan', 'supermarket', 'bakery', 'other'];
const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const openingHoursSchema = z.object({
  day: z.enum(weekdays),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).strict();

export const storeInputSchema = z.object({
  name: z.string(),
  business_type: z.enum(businessTypes),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  opening_hours: z.array(openingHoursSchema).optional(),
  contact_phone: z.string(),
  photo_url: z.string().url().optional(),
}).strict();
