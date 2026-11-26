import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/api-error';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Access token is missing'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role as Role };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token'));
  }
}