// src/controllers/payments.controller.js
import * as paymentsService from '../services/payments.service.js';

export async function createPayment(req, res) {
	const payment = await paymentsService.createOrderPayment(
		req.user.id,
		req.params.orderId,
		req.body.method,
	);

	return res.status(201).json(payment);
}

export async function webhook(req, res) {
	const result = await paymentsService.processPaymentWebhook(req.body, req.rawBody);
	return res.status(200).json(result);
}
