import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import type { AuthUser } from '../../middlewares/auth.middleware';
import type { CreateNoteBody, UpdateNoteBody, ListNotesQuery } from './note.schema';
import type { NoteStatus } from '../../generated/prisma/client';

const noteInclude = {
  author: { select: { id: true, displayName: true, email: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.NoteInclude;

type NoteWithRelations = Prisma.NoteGetPayload<{ include: typeof noteInclude }>;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function noteToDto(note: NoteWithRelations, point?: { lat: number; lng: number }, distance?: number) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    status: note.status,
    latitude: note.latitude,
    longitude: note.longitude,
    locationName: note.locationName,
    startsAt: note.startsAt,
    endsAt: note.endsAt,
    publishedAt: note.publishedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    author: note.author,
    tags: note.tags.map((t) => t.tag),
    ...(point && distance !== undefined ? { distanceMeters: Math.round(distance) } : {}),
  };
}

function buildOrderBy(sort: ListNotesQuery['sort']): Prisma.NoteOrderByWithRelationInput {
  switch (sort) {
    case 'createdAt': return { createdAt: 'asc' };
    case 'startsAt': return { startsAt: 'asc' };
    case '-startsAt': return { startsAt: 'desc' };
    case '-createdAt':
    default: return { createdAt: 'desc' };
  }
}

function buildWhere(user: AuthUser, q: ListNotesQuery): Prisma.NoteWhereInput {
  const where: Prisma.NoteWhereInput = { deletedAt: null };
  const isAdmin = user.role === 'ADMIN';

  // authorId = me -> user id
  let authorId = q.authorId;
  if (authorId === 'me') authorId = user.id;

  if (q.status === 'all') {
    if (!isAdmin) where.authorId = user.id;
  } else if (q.status === 'draft' || q.status === 'archived') {
    where.status = q.status.toUpperCase() as NoteStatus;
    if (!isAdmin) where.authorId = user.id;
  } else {
    where.status = 'PUBLISHED';
  }

  if (authorId) where.authorId = authorId;

  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: 'insensitive' } },
      { content: { contains: q.search, mode: 'insensitive' } },
      { locationName: { contains: q.search, mode: 'insensitive' } },
    ];
  }

  if (q.tagIds) {
    const ids = q.tagIds.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length) where.tags = { some: { tagId: { in: ids } } };
  }

  const now = new Date();
  if (q.activeNow === 'true') {
    where.startsAt = { lte: now };
    where.AND = [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }];
  } else if (q.timeFrom || q.timeTo) {
    where.AND = [
      { startsAt: { lte: q.timeTo ?? new Date('9999-12-31T23:59:59Z') } },
      { OR: [{ endsAt: null }, { endsAt: { gte: q.timeFrom ?? new Date(0) } }] },
    ];
  }

  if (q.minLat !== undefined && q.maxLat !== undefined) {
    where.latitude = { gte: q.minLat, lte: q.maxLat };
  }
  if (q.minLng !== undefined && q.maxLng !== undefined) {
    where.longitude = { gte: q.minLng, lte: q.maxLng };
  }

  if (q.radius !== undefined && q.lat !== undefined && q.lng !== undefined) {
    const dLat = q.radius / 111_320;
    const dLng = q.radius / (111_320 * Math.cos((q.lat * Math.PI) / 180));
    where.latitude = { gte: q.lat - dLat, lte: q.lat + dLat };
    where.longitude = { gte: q.lng - dLng, lte: q.lng + dLng };
  }

  return where;
}

export async function getNotes(user: AuthUser, q: ListNotesQuery) {
  const where = buildWhere(user, q);
  const skip = (q.page - 1) * q.limit;
  const useDistance = q.sort === 'distance' && q.lat !== undefined && q.lng !== undefined;

  let total: number;
  let items: ReturnType<typeof noteToDto>[];

  if (useDistance) {
    const candidates = await prisma.note.findMany({ where, include: noteInclude, take: 1000 });

    let withDistance = candidates.map((n) => ({
      note: n,
      d: haversineMeters(q.lat!, q.lng!, n.latitude, n.longitude),
    }));

    if (q.radius !== undefined) {
      withDistance = withDistance.filter((x) => x.d <= q.radius!);
    }
    withDistance.sort((a, b) => a.d - b.d);

    total = withDistance.length;
    items = withDistance
      .slice(skip, skip + q.limit)
      .map(({ note, d }) => noteToDto(note, { lat: q.lat!, lng: q.lng! }, d));
  } else {
    const [count, rows] = await prisma.$transaction([
      prisma.note.count({ where }),
      prisma.note.findMany({
        where,
        skip,
        take: q.limit,
        orderBy: buildOrderBy(q.sort),
        include: noteInclude,
      }),
    ]);

    total = count;
    items = rows.map((n) => noteToDto(n));
  }

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

export async function createNote(authorId: string, dto: CreateNoteBody) {
  const data: Prisma.NoteUncheckedCreateInput = {
    authorId,
    title: dto.title,
    content: dto.content,
    latitude: dto.latitude,
    longitude: dto.longitude,
    locationName: dto.locationName ?? null,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt ?? null,
  };

  if (dto.tagIds?.length) {
    data.tags = { create: dto.tagIds.map((tagId) => ({ tagId })) };
  }

  const note = await prisma.note.create({ data, include: noteInclude });
  return noteToDto(note);
}

function assertCanManage(note: NoteWithRelations, user: AuthUser) {
  const isOwner = note.authorId === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You cannot manage this note');
}

export async function getNoteById(id: string, user: AuthUser) {
  const note = await prisma.note.findUnique({ where: { id }, include: noteInclude });
  if (!note) throw ApiError.notFound('Note not found');

  const isOwner = note.authorId === user.id;
  const isAdmin = user.role === 'ADMIN';
  const isHidden = note.status !== 'PUBLISHED' || note.deletedAt !== null;
  if (isHidden && !isOwner && !isAdmin) throw ApiError.notFound('Note not found');

  return noteToDto(note);
}

export async function updateNote(id: string, user: AuthUser, dto: UpdateNoteBody) {
  const note = await prisma.note.findUnique({ where: { id }, include: noteInclude });
  if (!note || note.deletedAt) throw ApiError.notFound('Note not found');
  assertCanManage(note, user);

  const data: Prisma.NoteUpdateInput = {};
  if (dto.title !== undefined) data.title = dto.title;
  if (dto.content !== undefined) data.content = dto.content;
  if (dto.latitude !== undefined) data.latitude = dto.latitude;
  if (dto.longitude !== undefined) data.longitude = dto.longitude;
  if (dto.locationName !== undefined) data.locationName = dto.locationName;
  if (dto.startsAt !== undefined) data.startsAt = dto.startsAt;
  if (dto.endsAt !== undefined) data.endsAt = dto.endsAt;

  await prisma.note.update({ where: { id }, data });

  if (dto.tagIds) {
    await prisma.$transaction([
      prisma.noteTag.deleteMany({ where: { noteId: id } }),
      prisma.noteTag.createMany({ data: dto.tagIds.map((tagId) => ({ noteId: id, tagId })) }),
    ]);
  }

  const updated = await prisma.note.findUniqueOrThrow({ where: { id }, include: noteInclude });
  return noteToDto(updated);
}

export async function deleteNote(id: string, user: AuthUser) {
  const note = await prisma.note.findUnique({ where: { id }, include: noteInclude });
  if (!note || note.deletedAt) throw ApiError.notFound('Note not found');
  assertCanManage(note, user);

  await prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  return { id };
}

export async function setStatus(id: string, user: AuthUser, status: 'PUBLISHED' | 'ARCHIVED') {
  const note = await prisma.note.findUnique({ where: { id }, include: noteInclude });
  if (!note || note.deletedAt) throw ApiError.notFound('Note not found');
  assertCanManage(note, user);

  const updated = await prisma.note.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? (note.publishedAt ?? new Date()) : note.publishedAt,
    },
    include: noteInclude,
  });

  return noteToDto(updated);
}

export async function restoreNote(id: string, user: AuthUser) {
  const note = await prisma.note.findUnique({ where: { id }, include: noteInclude });
  if (!note || !note.deletedAt) throw ApiError.notFound('Note not found');
  assertCanManage(note, user);

  const updated = await prisma.note.update({
    where: { id },
    data: { deletedAt: null },
    include: noteInclude,
  });

  return noteToDto(updated);
}