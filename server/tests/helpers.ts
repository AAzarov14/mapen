import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

export const api = request(createApp());
export const TEST_PASSWORD = 'password123';

export async function registerUser(email = 'user@test.com') {
  const res = await api.post('/api/v1/auth/register').send({ email, password: TEST_PASSWORD });
  return { token: res.body.data.accessToken as string, user: res.body.data.user };
}

export async function loginUser(email: string, password = TEST_PASSWORD) {
  const res = await api.post('/api/v1/auth/login').send({ email, password });
  return { token: res.body.data.accessToken as string };
}

export async function makeAdmin(email: string) {
  await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
}

export async function createNote(token: string, opts: Record<string, unknown> = {}) {
  const res = await api
    .post('/api/v1/notes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Заметка',
      content: 'Текст заметки',
      latitude: 55.75,
      longitude: 37.61,
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      ...opts,
    });

  if (opts.publish) {
    await api.post(`/api/v1/notes/${res.body.data.id}/publish`).set('Authorization', `Bearer ${token}`);
  }
  return res.body.data;
}