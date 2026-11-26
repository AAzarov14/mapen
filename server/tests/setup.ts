import { prisma } from '../src/lib/prisma';

beforeEach(async () => {
  await prisma.noteTag.deleteMany();
  await prisma.note.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});