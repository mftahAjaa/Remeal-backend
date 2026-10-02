// src/controllers/seller-orders.controller.js
import * as sellerOrdersService from '../services/seller-orders.service.js';

export async function listOrders(req, res) {
	const result = await sellerOrdersService.listSellerOrders(req.user.id, req.query);
	return res.status(200).json(result);
}

export async function getOrder(req, res) {
	const result = await sellerOrdersService.getSellerOrder(req.user.id, req.params.orderId);
	return res.status(200).json(result);
}

export async function confirmOrder(req, res) {
	const result = await sellerOrdersService.confirmSellerOrder(req.user.id, req.params.orderId);
	return res.status(200).json(result);
}

export async function verifyQr(req, res) {
	const result = await sellerOrdersService.verifyPickupQr(req.user.id, req.body.qr_code);
	return res.status(200).json(result);
}

export async function completeOrder(req, res) {
	const result = await sellerOrdersService.completeSellerOrder(req.user.id, req.params.orderId);
	return res.status(200).json(result);
}
