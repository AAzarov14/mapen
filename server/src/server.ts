import { createApp } from './app';
import { prisma } from './lib/prisma';

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));