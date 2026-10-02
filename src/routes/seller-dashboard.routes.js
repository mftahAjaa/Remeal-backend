import { Router } from 'express';
import * as sellerDashboardController from '../controllers/seller-dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();
const requireSeller = [requireAuth, requireRole('seller')];

router.get('/seller/dashboard', ...requireSeller, sellerDashboardController.getDashboard);
router.get('/seller/stock-reminders', ...requireSeller, sellerDashboardController.getStockReminders);

export default router;