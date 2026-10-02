// src/middleware/role.js
import { AppError } from '../utils/errors.js';

export function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Token tidak ada atau tidak valid.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki izin untuk mengakses fitur ini.'));
    }

    return next();
  };
}