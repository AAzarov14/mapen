import jwt, { type SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

const ACCESS_TTL = (process.env.ACCESS_TOKEN_TTL ?? '15m') as SignOptions['expiresIn'];

export const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS ?? 30);
const REFRESH_TTL = `${REFRESH_TTL_DAYS}d` as SignOptions['expiresIn'];

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET);
  if (typeof payload === 'string') throw new Error('Unexpected token payload');
  return payload as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, REFRESH_SECRET);
  if (typeof payload === 'string') throw new Error('Unexpected token payload');
  return payload as RefreshTokenPayload;
}