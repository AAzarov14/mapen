import { api, registerUser, createNote } from './helpers';

describe('Notes', () => {
  it('5. create note: 201 со статусом DRAFT; невалидные координаты → 400', async () => {
    const { token } = await registerUser();
    const base = { title: 'Встреча', content: 'У выхода 3', latitude: 55.75, longitude: 37.61, startsAt: '2026-11-26T18:00:00Z' };

    const res = await api.post('/api/v1/notes').set('Authorization', `Bearer ${token}`).send(base);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');

    const bad = await api.post('/api/v1/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, latitude: 999 });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('6. черновик виден только автору; после publish - всем', async () => {
    const author = await registerUser('author@test.com');
    const other = await registerUser('other@test.com');
    const note = await createNote(author.token);

    const authorDrafts = await api.get('/api/v1/notes?status=draft').set('Authorization', `Bearer ${author.token}`);
    expect(authorDrafts.body.data).toHaveLength(1);

    const otherFeed = await api.get('/api/v1/notes').set('Authorization', `Bearer ${other.token}`);
    expect(otherFeed.body.data).toHaveLength(0);

    await api.post(`/api/v1/notes/${note.id}/publish`).set('Authorization', `Bearer ${author.token}`);
    const otherAfter = await api.get('/api/v1/notes').set('Authorization', `Bearer ${other.token}`);
    expect(otherAfter.body.data).toHaveLength(1);
  });

  it('7. фильтры радиус + activeNow + сортировка по расстоянию + meta пагинации', async () => {
    const { token } = await registerUser();
    const now = Date.now();
    const inHour = new Date(now + 3600_000).toISOString();

    // близко и активно сейчас
    await createNote(token, { publish: true, latitude: 55.750, longitude: 37.610, startsAt: new Date(now - 60_000).toISOString(), endsAt: inHour });
    // далеко
    await createNote(token, { publish: true, latitude: 56.5, longitude: 38.5 });
    // близко, но начнется через час
    await createNote(token, { publish: true, latitude: 55.751, longitude: 37.611, startsAt: inHour });

    const res = await api
      .get('/api/v1/notes?lat=55.75&lng=37.61&radius=5000&activeNow=true&sort=distance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0]).toHaveProperty('distanceMeters');
  });
});