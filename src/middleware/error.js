// src/middleware/error.js
import { AppError } from '../utils/errors.js';

export function notFound(req, res, next) {
  return next(new AppError(404, 'NOT_FOUND', 'Rute tidak ditemukan.'));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const appError =
    error instanceof AppError
      ? error
      : new AppError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server.');

  if (appError.status >= 500) {
    console.error(error);
  }

  return res.status(appError.status).json({
    code: appError.code,
    message: appError.message,
    details: appError.details,
  });
}