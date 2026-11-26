import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8).max(72),
    displayName: z.string().min(2).max(50).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];