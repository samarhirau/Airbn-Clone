import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/** Terminal 404 handler for unmatched routes. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
