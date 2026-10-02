import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  categoryIdParamsSchema,
  createCategorySchema,
  listComplaintsQuerySchema,
  listOrdersQuerySchema,
  listReviewReportsQuerySchema,
  listStoresQuerySchema,
  listUsersQuerySchema,
  platformSettingsSchema,
  updateComplaintParamsSchema,
  updateComplaintSchema,
  updateCategorySchema,
  updateUserParamsSchema,
  updateUserSchema,
  moderateReviewSchema,
  reviewModerationParamsSchema,
  verificationParamsSchema,
  verificationSchema,
} from '../validators/admin.validator.js';

const router = Router();
const requireAdmin = [requireAuth, requireRole('super_admin')];

router.get('/admin/dashboard', ...requireAdmin, adminController.getDashboard);
router.get(
  '/admin/review-reports',
  ...requireAdmin,
  validate(listReviewReportsQuerySchema, 'query'),
  adminController.listReviewReports,
);
router.patch(
  '/admin/reviews/:reviewId/moderation',
  ...requireAdmin,
  validate(reviewModerationParamsSchema, 'params'),
  validate(moderateReviewSchema),
  adminController.moderateReview,
);
router.get(
  '/admin/users',
  ...requireAdmin,
  validate(listUsersQuerySchema, 'query'),
  adminController.listUsers,
);
router.patch(
  '/admin/users/:userId',
  ...requireAdmin,
  validate(updateUserParamsSchema, 'params'),
  validate(updateUserSchema),
  adminController.updateUser,
);
router.delete(
  '/admin/users/:userId',
  ...requireAdmin,
  validate(updateUserParamsSchema, 'params'),
  adminController.deleteUser,
);
router.get(
  '/admin/orders',
  ...requireAdmin,
  validate(listOrdersQuerySchema, 'query'),
  adminController.listOrders,
);
router.get(
  '/admin/complaints',
  ...requireAdmin,
  validate(listComplaintsQuerySchema, 'query'),
  adminController.listComplaints,
);
router.patch(
  '/admin/complaints/:complaintId',
  ...requireAdmin,
  validate(updateComplaintParamsSchema, 'params'),
  validate(updateComplaintSchema),
  adminController.updateComplaint,
);
router.get('/admin/settings', ...requireAdmin, adminController.getSettings);
router.patch(
  '/admin/settings',
  ...requireAdmin,
  validate(platformSettingsSchema),
  adminController.updateSettings,
);

router.get(
  '/admin/stores',
  ...requireAdmin,
  validate(listStoresQuerySchema, 'query'),
  adminController.listStores,
);
router.patch(
  '/admin/stores/:storeId/verification',
  ...requireAdmin,
  validate(verificationParamsSchema, 'params'),
  validate(verificationSchema),
  adminController.verifyStore,
);
router.post(
  '/admin/categories',
  ...requireAdmin,
  validate(createCategorySchema),
  adminController.createCategory,
);
router.patch(
  '/admin/categories/:categoryId',
  ...requireAdmin,
  validate(categoryIdParamsSchema, 'params'),
  validate(updateCategorySchema),
  adminController.updateCategory,
);
router.delete(
  '/admin/categories/:categoryId',
  ...requireAdmin,
  validate(categoryIdParamsSchema, 'params'),
  adminController.deleteCategory,
);

export default router;