import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const changeRoleBodySchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'ADMIN']),
  }),
});

export const updateUserBodySchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    displayName: z.string().min(1).max(50).optional(),
  }),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>['query'];
export type ChangeRoleBody = z.infer<typeof changeRoleBodySchema>['body'];
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>['body'];