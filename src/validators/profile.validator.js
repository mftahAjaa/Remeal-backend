// src/validators/profile.validator.js
import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    full_name: z.string(),
    phone: z.string(),
    avatar_url: z.string().url(),
  })
  .partial()
  .strict();