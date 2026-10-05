// src/controllers/orders.controller.js
import * as ordersService from '../services/orders.service.js';

export async function createOrder(req, res, next) {
	try {
		const result = await ordersService.createOrder(req.user.id, req.body);
		return res.status(201).json(result);
	} catch (error) {
		next(error);
	}
}

export async function listOrders(req, res, next) {
	try {
		const result = await ordersService.listOrders(req.user.id, req.query);
		return res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

export async function getOrder(req, res, next) {
	try {
		const result = await ordersService.getOrder(req.user.id, req.params.orderId);
		return res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

export async function cancelOrder(req, res, next) {
	try {
		const result = await ordersService.cancelOrder(req.user.id, req.params.orderId);
		return res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}
