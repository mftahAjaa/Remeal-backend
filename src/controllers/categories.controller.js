// src/controllers/categories.controller.js
import * as categoriesService from '../services/categories.service.js';

export async function listCategories(req, res) {
	const result = await categoriesService.listCategories();
	return res.status(200).json(result);
}
