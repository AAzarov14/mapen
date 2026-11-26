import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/api-error';

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body: any;
        query: any;
        params: any;
      };
    }
  }
}

export function validate(...schemas: ZodType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const input = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const merged = { body: {}, query: {}, params: {} } as {
      body: any;
      query: any;
      params: any;
    };

    for (const schema of schemas) {
      const result = schema.safeParse(input);

      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(ApiError.badRequest('Validation failed', details));
      }

      const data = result.data as Partial<typeof merged>;
      merged.body = { ...merged.body, ...data.body };
      merged.query = { ...merged.query, ...data.query };
      merged.params = { ...merged.params, ...data.params };
    }

    req.validated = merged;
    return next();
  };
}