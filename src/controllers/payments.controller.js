// src/controllers/payments.controller.js
import * as paymentsService from '../services/payments.service.js';

export async function createPayment(req, res, next) {
	try {
		const payment = await paymentsService.createOrderPayment(
			req.user.id,
			req.params.orderId,
			req.body.method,
		);
		return res.status(201).json(payment);
	} catch (error) {
		next(error);
	}
}

export async function webhook(req, res, next) {
	try {
		const result = await paymentsService.processPaymentWebhook(req.body, req.rawBody);
		return res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

export async function simulatePayment(req, res, next) {
	try {
		const result = await paymentsService.simulatePaymentSuccess(req.body.external_id);
		return res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}
