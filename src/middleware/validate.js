// src/middleware/validate.js
import { AppError } from '../utils/errors.js';

const allowedSources = new Set(['body', 'query', 'params']);

export function validate(zodSchema, source = 'body') {
  if (!allowedSources.has(source)) {
    throw new TypeError("Sumber validasi harus 'body', 'query', atau 'params'.");
  }

  return async function validationMiddleware(req, res, next) {
    try {
      const result = await zodSchema.safeParseAsync(req[source]);

      if (!result.success) {
        const issues = result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
        }));

        return next(
          new AppError(422, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid.', { issues }),
        );
      }

      Object.defineProperty(req, source, {
        configurable: true,
        enumerable: true,
        value: result.data,
        writable: true,
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}