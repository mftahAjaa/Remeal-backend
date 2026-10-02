// src/controllers/reviews.controller.js
import * as reviewsService from '../services/reviews.service.js';

export async function createReview(req, res) {
	const result = await reviewsService.createReview(req.user.id, req.params.orderId, req.body);
	return res.status(201).json(result);
}

export async function updateReview(req, res) {
	const result = await reviewsService.updateReview(req.user.id, req.params.reviewId, req.body);
	return res.status(200).json(result);
}

export async function reportReview(req, res) {
	const result = await reviewsService.reportReview(req.user.id, req.params.reviewId, req.body);
	return res.status(201).json(result);
}

export async function listSellerReviews(req, res) {
	const result = await reviewsService.listSellerReviews(req.user.id);
	return res.status(200).json(result);
}

export async function replyToReview(req, res) {
	const result = await reviewsService.replyToReview(
		req.user.id,
		req.params.reviewId,
		req.body.reply,
	);
	return res.status(200).json(result);
}
