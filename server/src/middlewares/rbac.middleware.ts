import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/client';
import { ApiError } from '../utils/api-error';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    return next();
  };
}