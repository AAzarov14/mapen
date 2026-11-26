import { z } from 'zod';

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    content: z.string().min(3).max(5000),
    latitude,
    longitude,
    locationName: z.string().max(255).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional(),
    tagIds: z.array(z.string()).optional(),
  }).refine((d) => !d.endsAt || d.endsAt >= d.startsAt, 'endsAt must be after startsAt'),
});

export const updateNoteSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(3).max(120).optional(),
    content: z.string().min(3).max(5000).optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
    locationName: z.string().max(255).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    tagIds: z.array(z.string()).optional(),
  }).refine(
    (d) => !d.startsAt || !d.endsAt || d.endsAt >= d.startsAt,
    'endsAt must be after startsAt',
  ),
});

export const listNotesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).optional(),
    status: z.enum(['draft', 'published', 'archived', 'all']).optional(),
    authorId: z.string().min(1).optional(), // можно передать me
    tagIds: z.string().min(1).optional(),   // id1,id2
    timeFrom: z.coerce.date().optional(),
    timeTo: z.coerce.date().optional(),
    activeNow: z.enum(['true', 'false']).optional(),
    lat: latitude.optional(),
    lng: longitude.optional(),
    radius: z.coerce.number().positive().max(200_000).optional(), // метры
    minLat: latitude.optional(),
    maxLat: latitude.optional(),
    minLng: longitude.optional(),
    maxLng: longitude.optional(),
    sort: z
      .enum(['createdAt', '-createdAt', 'startsAt', '-startsAt', 'distance'])
      .default('-createdAt'),
  })
    .refine((q) => q.sort !== 'distance' || (q.lat !== undefined && q.lng !== undefined),
      'lat and lng are required for sort=distance')
    .refine((q) => q.radius === undefined || (q.lat !== undefined && q.lng !== undefined),
      'lat and lng are required with radius'),
});

export const noteIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type CreateNoteBody = z.infer<typeof createNoteSchema>['body'];
export type UpdateNoteBody = z.infer<typeof updateNoteSchema>['body'];
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>['query'];