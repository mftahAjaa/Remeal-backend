// src/validators/auth.validator.js
import { z } from 'zod';

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).optional(),
    password: z.string().min(8),
    role: z.enum(['consumer', 'seller']),
  })
  .refine((body) => Boolean(body.email || body.phone), {
    message: 'Email atau nomor HP wajib diisi.',
    path: ['email'],
  });

export const sendOtpSchema = z.object({
  identifier: z.string().trim().min(1),
});

export const verifyOtpSchema = z.object({
  identifier: z.string().trim().min(1),
  otp: z.string().trim().min(1),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  new_password: z.string().min(8),
});