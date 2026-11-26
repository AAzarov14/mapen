import { config } from 'dotenv';
config({ path: ['.env', '../.env'], quiet: true });
import { execSync } from 'node:child_process';

export default async function globalSetup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/mapen_test';

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}