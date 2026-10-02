import * as categoriesService from '../services/categories.service.js';
import * as adminService from '../services/admin.service.js';
import * as complaintsService from '../services/complaints.service.js';
import * as storesService from '../services/stores.service.js';
import * as reviewsService from '../services/reviews.service.js';

export async function getDashboard(req, res) {
	const result = await adminService.getDashboard();
	return res.status(200).json(result);
}

export async function listReviewReports(req, res) {
	const result = await reviewsService.listAdminReviewReports(req.query);
	return res.status(200).json(result);
}

export async function moderateReview(req, res) {
	const result = await reviewsService.moderateReview(
		req.user.id,
		req.params.reviewId,
		req.body,
	);
	return res.status(200).json(result);
}

export async function listUsers(req, res) {
	const result = await adminService.listUsers(req.query);
	return res.status(200).json(result);
}

export async function updateUser(req, res) {
	const result = await adminService.updateUser(req.params.userId, req.body);
	return res.status(200).json(result);
}

export async function deleteUser(req, res) {
	await adminService.deleteUser(req.params.userId);
	return res.status(204).end();
}

export async function listOrders(req, res) {
	const result = await adminService.listOrders(req.query);
	return res.status(200).json(result);
}

export async function listComplaints(req, res) {
	const result = await complaintsService.listAdminComplaints(req.query);
	return res.status(200).json(result);
}

export async function updateComplaint(req, res) {
	const result = await complaintsService.updateAdminComplaint(
		req.user.id,
		req.params.complaintId,
		req.body,
	);
	return res.status(200).json(result);
}

export async function getSettings(req, res) {
	const result = await adminService.getSettings();
	return res.status(200).json(result);
}

export async function updateSettings(req, res) {
	const result = await adminService.updateSettings(req.body);
	return res.status(200).json(result);
}

export async function listStores(req, res) {
	const result = await storesService.listAdminStores(req.query);
	return res.status(200).json(result);
}

export async function verifyStore(req, res) {
	const result = await storesService.verifyStore(req.user.id, req.params.storeId, req.body);
	return res.status(200).json(result);
}

export async function createCategory(req, res) {
	const result = await categoriesService.createCategory(req.body);
	return res.status(201).json(result);
}

export async function updateCategory(req, res) {
	const result = await categoriesService.updateCategory(req.params.categoryId, req.body);
	return res.status(200).json(result);
}

export async function deleteCategory(req, res) {
	await categoriesService.deleteCategory(req.params.categoryId);
	return res.status(204).end();
}
