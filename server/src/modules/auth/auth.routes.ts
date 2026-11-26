import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import * as controller from './auth.controller';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), controller.register);
authRouter.post('/login', validate(loginSchema), controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);

authRouter.get('/me', requireAuth, controller.me);
authRouter.post('/change-password', requireAuth, validate(changePasswordSchema), controller.changePassword);