import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: ['.env', '../.env', 'prisma/.env'] });

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: 'src/prisma/migrations',
    seed: 'tsx src/prisma/seed.ts',
  },
});