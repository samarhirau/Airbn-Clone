import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import type { UserRole } from '../models/User';

// Role-based authorization.
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action.'));
    }
    next();
  };
}
