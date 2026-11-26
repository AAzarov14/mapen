import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import { ApiError } from '../utils/api-error';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Unique constraint violated' },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      });
    }
  }

  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}