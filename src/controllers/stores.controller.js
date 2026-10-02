// src/controllers/stores.controller.js
import * as storesService from '../services/stores.service.js';
import * as reviewsService from '../services/reviews.service.js';

export async function listStores(req, res) {
	const result = await storesService.listStores(req.query);
	return res.status(200).json(result);
}

export async function getStore(req, res) {
	const result = await storesService.getStore(req.params.storeId);
	return res.status(200).json(result);
}

export async function listStoreReviews(req, res) {
	const result = await reviewsService.listStoreReviews(req.params.storeId, req.query);
  return res.status(200).json(result);
}

export async function createStore(req, res) {
	const result = await storesService.createStore(req.user.id, req.body);
	return res.status(201).json(result);
}

export async function getMyStore(req, res) {
	const result = await storesService.getMyStore(req.user.id);
	return res.status(200).json(result);
}

export async function updateMyStore(req, res) {
	const result = await storesService.updateMyStore(req.user.id, req.body);
	return res.status(200).json(result);
}
