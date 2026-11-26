import type { Prisma, Role } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthUser } from '../../middlewares/auth.middleware';
import type { ListUsersQuery, ChangeRoleBody, UpdateUserBody } from './admin.schema';

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

function buildWhere(q: ListUsersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (q.role) where.role = q.role;
  if (q.isActive !== undefined) where.isActive = q.isActive === 'true';

  if (q.search) {
    where.OR = [
      { email: { contains: q.search, mode: 'insensitive' } },
      { displayName: { contains: q.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function getUsers(q: ListUsersQuery) {
  const where = buildWhere(q);
  const skip = (q.page - 1) * q.limit;

  const [total, items] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: q.limit,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    }),
  ]);

  const totalPages = Math.ceil(total / q.limit);

  return {
    items,
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages,
      hasNext: q.page < totalPages,
      hasPrev: q.page > 1,
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function updateUser(id: string, actor: AuthUser, dto: UpdateUserBody) {
  if (id === actor.id) {
    throw ApiError.forbidden('Cannot update own account via admin endpoint');
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');

  const data: Prisma.UserUpdateInput = {};
  if (dto.role !== undefined) data.role = dto.role;
  if (dto.isActive !== undefined) data.isActive = dto.isActive;
  if (dto.displayName !== undefined) data.displayName = dto.displayName;

  const updated = await prisma.user.update({ where: { id }, data, select: userSelect });
  return updated;
}

export async function changeRole(id: string, actor: AuthUser, dto: ChangeRoleBody) {
  if (id === actor.id) {
    throw ApiError.forbidden('Cannot change own role via admin endpoint');
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');

  const updated = await prisma.user.update({
    where: { id },
    data: { role: dto.role as Role },
    select: userSelect,
  });

  return updated;
}

export async function toggleActive(id: string, actor: AuthUser, isActive: boolean) {
  if (id === actor.id) {
    throw ApiError.forbidden('Cannot deactivate own account');
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: userSelect,
  });

  return updated;
}