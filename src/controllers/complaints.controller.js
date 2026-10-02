// src/controllers/complaints.controller.js
import * as complaintsService from '../services/complaints.service.js';

export async function createComplaint(req, res) {
	const result = await complaintsService.createComplaint(req.user.id, req.user.role, req.body);
	return res.status(201).json(result);
}
