// src/controllers/me.controller.js
import * as profileService from '../services/profile.service.js';

export async function getMyProfile(req, res) {
	const result = await profileService.getMyProfile(req.user.id);
	return res.status(200).json(result);
}

export async function updateMyProfile(req, res) {
	const result = await profileService.updateMyProfile(req.user.id, req.body);
	return res.status(200).json(result);
}
