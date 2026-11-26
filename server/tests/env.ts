import { config } from 'dotenv';
config({ path: ['.env', '../.env'], quiet: true });

process.env.NODE_ENV = 'test';

const base = new URL(process.env.DATABASE_URL!);
base.pathname = '/mapen_test';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? base.toString();
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';