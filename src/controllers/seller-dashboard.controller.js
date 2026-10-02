import * as sellerDashboardService from '../services/seller-dashboard.service.js';

export async function getDashboard(req, res) {
	const result = await sellerDashboardService.getSellerDashboard(req.user.id);
	return res.status(200).json(result);
}

export async function getStockReminders(req, res) {
	const result = await sellerDashboardService.getSellerStockReminders(req.user.id);
	return res.status(200).json(result);
}
