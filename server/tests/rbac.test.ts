import { api, registerUser, loginUser, makeAdmin, createNote, TEST_PASSWORD } from './helpers';

describe('RBAC', () => {
  it('8. чужую заметку не изменить; /admin/users только для ADMIN', async () => {
    const owner = await registerUser('owner@test.com');
    const stranger = await registerUser('stranger@test.com');
    const note = await createNote(owner.token);

    const patch = await api.patch(`/api/v1/notes/${note.id}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ title: 'Хакнуто' });
    expect(patch.status).toBe(403);

    const asUser = await api.get('/api/v1/admin/users').set('Authorization', `Bearer ${stranger.token}`);
    expect(asUser.status).toBe(403);

    // повышаем роль в БД и перезалогиниваемся: роль живёт в JWT, поэтому нужен новый токен
    await makeAdmin('stranger@test.com');
    const { token: adminToken } = await loginUser('stranger@test.com', TEST_PASSWORD);

    const asAdmin = await api.get('/api/v1/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.meta.total).toBe(2);
  });
});