// src/controllers/products.controller.js
import * as productsService from '../services/products.service.js';

export async function searchProducts(req, res) {
	const result = await productsService.searchProducts(req.query);
	return res.status(200).json(result);
}

export async function getProduct(req, res) {
	const result = await productsService.getProduct(req.params.productId);
	return res.status(200).json(result);
}
