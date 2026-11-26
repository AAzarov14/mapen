import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { REFRESH_TTL_DAYS } from '../../utils/jwt';
import { ApiError } from '../../utils/api-error';
import type { RegisterBody, LoginBody, ChangePasswordBody } from './auth.schema';

const REFRESH_COOKIE = 'refreshToken';
const DAY_MS = 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: REFRESH_TTL_DAYS * DAY_MS,
  });
}

function getRefreshCookie(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE];
}

export async function register(req: Request, res: Response) {
  const dto = req.validated!.body as RegisterBody;
  const result = await authService.register(dto);

  setRefreshCookie(res, result.refreshToken);
  res.status(201).json({ data: { user: result.user, accessToken: result.accessToken } });
}

export async function login(req: Request, res: Response) {
  const dto = req.validated!.body as LoginBody;
  const result = await authService.login(dto);

  setRefreshCookie(res, result.refreshToken);
  res.json({ data: { user: result.user, accessToken: result.accessToken } });
}

export async function refresh(req: Request, res: Response) {
  const token = getRefreshCookie(req);
  if (!token) throw ApiError.unauthorized('Refresh token cookie is missing');

  const result = await authService.refresh(token);

  setRefreshCookie(res, result.refreshToken);
  res.json({ data: { accessToken: result.accessToken } });
}

export async function logout(req: Request, res: Response) {
  await authService.logout(getRefreshCookie(req));
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);
  res.json({ data: user });
}

export async function changePassword(req: Request, res: Response) {
  const dto = req.validated!.body as ChangePasswordBody;
  await authService.changePassword(req.user!.id, dto);
  res.status(204).send();
}