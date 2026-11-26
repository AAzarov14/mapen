import { createHash, randomUUID } from 'node:crypto';
import type { User } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TTL_DAYS,
} from '../../utils/jwt';
import { ApiError } from '../../utils/api-error';
import type { RegisterBody, LoginBody, ChangePasswordBody } from './auth.schema';

const DAY_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function createSession(user: User) {
  const jti = randomUUID();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id, jti);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * DAY_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(dto: RegisterBody) {
  const email = dto.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('Email already in use');

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(dto.password),
      displayName: dto.displayName ?? null,
    },
  });

  const tokens = await createSession(user);
  return { user: publicUser(user), ...tokens };
}

export async function login(dto: LoginBody) {
  const user = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });

  if (!user || !(await comparePassword(dto.password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Account is deactivated');
  }

  const tokens = await createSession(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  if (stored.tokenHash !== hashToken(refreshToken)) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Refresh token reuse detected');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive) throw ApiError.unauthorized();

  const newJti = randomUUID();
  const newRefreshToken = signRefreshToken(user.id, newJti);
  const accessToken = signAccessToken(user);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedByTokenHash: hashToken(newRefreshToken) },
    }),
    prisma.refreshToken.create({
      data: {
        id: newJti,
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * DAY_MS),
      },
    }),
  ]);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  return publicUser(user);
}

export async function changePassword(userId: string, dto: ChangePasswordBody) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');

  const ok = await comparePassword(dto.currentPassword, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');

  const passwordHash = await hashPassword(dto.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}