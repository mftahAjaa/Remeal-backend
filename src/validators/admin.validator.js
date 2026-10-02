import { z } from 'zod';

const verificationStatuses = ['pending', 'approved', 'rejected', 'suspended'];
const orderStatuses = ['pending_payment', 'paid', 'confirmed', 'completed', 'cancelled', 'expired'];

export const listStoresQuerySchema = z.object({
  verification_status: z.enum(verificationStatuses).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const verificationParamsSchema = z.object({
  storeId: z.string().uuid(),
});

export const verificationSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  reason: z.string().trim().optional(),
}).strict().superRefine((input, context) => {
  if ((input.status === 'rejected' || input.status === 'suspended') && !input.reason) {
    context.addIssue({ code: 'custom', path: ['reason'], message: 'Alasan wajib diisi.' });
  }
});

export const createCategorySchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
}).strict();

export const categoryIdParamsSchema = z.object({
  categoryId: z.string().uuid(),
});

export const updateCategorySchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
}).strict().refine((input) => Object.keys(input).length > 0);

export const listUsersQuerySchema = z.object({
  role: z.enum(['consumer', 'seller', 'super_admin']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const updateUserParamsSchema = z.object({ userId: z.string().uuid() });
export const updateUserSchema = z.object({ is_active: z.boolean() }).strict();

export const listOrdersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  store_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listComplaintsQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const updateComplaintParamsSchema = z.object({ complaintId: z.string().uuid() });
export const updateComplaintSchema = z.object({
  status: z.enum(['in_progress', 'resolved']),
  resolution_note: z.string().optional(),
}).strict();

export const platformSettingsSchema = z.object({
  platform_fee_percent: z.number().min(0).max(100).optional(),
  payment_expiry_minutes: z.number().int().positive().optional(),
  review_edit_window_hours: z.number().int().positive().optional(),
  max_search_radius_km: z.number().positive().optional(),
}).strict().refine((input) => Object.keys(input).length > 0);

export const listReviewReportsQuerySchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']).default('open'),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const reviewModerationParamsSchema = z.object({ reviewId: z.string().uuid() });
export const moderateReviewSchema = z.object({
  action: z.enum(['show', 'hide', 'delete']),
  note: z.string().optional(),
}).strict();