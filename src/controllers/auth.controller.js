// src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';

export async function register(req, res) {
	const result = await authService.register(req.body);
	return res.status(201).json(result);
}

export async function sendOtp(req, res) {
	const result = await authService.sendOtp(req.body);
	return res.status(200).json(result);
}

export async function verifyOtp(req, res) {
	const result = await authService.verifyOtp(req.body);
	return res.status(200).json(result);
}

export async function login(req, res) {
	const result = await authService.login(req.body);
	return res.status(200).json(result);
}

export async function logout(req, res) {
	const result = await authService.logout(req.user.token);
	return res.status(200).json(result);
}

export async function forgotPassword(req, res) {
	const result = await authService.forgotPassword(req.body);
	return res.status(200).json(result);
}

export async function resetPassword(req, res) {
	const result = await authService.resetPassword(req.body);
	return res.status(200).json(result);
}
