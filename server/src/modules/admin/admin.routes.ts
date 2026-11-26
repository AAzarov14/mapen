import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './admin.controller';
import {
  listUsersQuerySchema,
  userIdParamSchema,
  changeRoleBodySchema,
  updateUserBodySchema,
} from './admin.schema';

export const adminRouter = Router();

// Весь роутер только для админов
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/users', validate(listUsersQuerySchema), controller.getUsers);
adminRouter.get('/users/:id', validate(userIdParamSchema), controller.getUserById);
adminRouter.patch('/users/:id', validate(userIdParamSchema, updateUserBodySchema), controller.updateUser);
adminRouter.patch('/users/:id/role', validate(userIdParamSchema, changeRoleBodySchema), controller.changeRole);
adminRouter.post('/users/:id/activate', validate(userIdParamSchema), controller.activateUser);
adminRouter.post('/users/:id/deactivate', validate(userIdParamSchema), controller.deactivateUser);