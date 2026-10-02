import * as productsService from '../services/products.service.js';

export async function listProducts(req, res) {
	const result = await productsService.listSellerProducts(req.user.id, req.query);
	return res.status(200).json({
		...result,
		data: result.data.map(productsService.toProductResponse),
	});
}

export async function createProduct(req, res) {
	const result = await productsService.createSellerProduct(req.user.id, req.body);
	return res.status(201).json(productsService.toProductResponse(result));
}

export async function updateProduct(req, res) {
	const result = await productsService.updateSellerProduct(
		req.user.id,
		req.params.productId,
		req.body,
	);
	return res.status(200).json(productsService.toProductResponse(result));
}

export async function deleteProduct(req, res) {
	await productsService.deleteSellerProduct(req.user.id, req.params.productId);
	return res.status(204).end();
}

export async function closeProduct(req, res) {
	const result = await productsService.closeSellerProduct(req.user.id, req.params.productId);
	return res.status(200).json(productsService.toProductResponse(result));
}
