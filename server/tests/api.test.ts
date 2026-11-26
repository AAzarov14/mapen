import { api, registerUser } from './helpers';

describe('Auth', () => {
  it('1. register создаёт пользователя с ролью USER и выдаёт accessToken', async () => {
    const res = await api.post('/api/v1/auth/register').send({
      email: 'ivan@test.com',
      password: 'password123',
      displayName: 'Ivan',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('USER');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('2. register с занятым email возвращает 409', async () => {
    const payload = { email: 'dup@test.com', password: 'password123' };
    await api.post('/api/v1/auth/register').send(payload);

    const res = await api.post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('3. login с неверным паролем возвращает 401', async () => {
    await api.post('/api/v1/auth/register').send({ email: 'login@test.com', password: 'password123' });

    const res = await api.post('/api/v1/auth/login').send({ email: 'login@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('4. GET /auth/me: без токена 401, с токеном 200', async () => {
    const anon = await api.get('/api/v1/auth/me');
    expect(anon.status).toBe(401);

    const { token } = await registerUser('me@test.com');
    const res = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@test.com');
  });
});