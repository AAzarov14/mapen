import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authRouter } from './modules/auth/auth.routes';
import { noteRouter } from './modules/notes/note.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.middleware';

import swaggerUi from 'swagger-ui-express';
import { openapiDocument } from './docs/openapi';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    '/api/v1/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }),
  );

  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/notes', noteRouter);
  app.use('/api/v1/admin', adminRouter);

  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
    app.get('/api/v1/docs.json', (_req, res) => res.json(openapiDocument));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}