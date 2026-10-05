import * as sellerDashboardService from '../services/seller-dashboard.service.js';

export async function getDashboard(req, res, next) {
	try {
		console.log("getDashboard called for user", req.user?.id);
		const result = await sellerDashboardService.getSellerDashboard(req.user.id);
		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in getDashboard:", error);
		next(error);
	}
}

export async function getStockReminders(req, res, next) {
	try {
		const result = await sellerDashboardService.getSellerStockReminders(req.user.id);
		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in getStockReminders:", error);
		next(error);
	}
}
