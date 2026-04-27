import { PrismaClient } from '@prisma/client';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';

describe('Gyms (Default/backfill) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('GYM-01: default gym exists; fighters get non-null gymId', async () => {
    const { app } = await createTestApp();

    const defaultGym = await prisma.gym.findUnique({ where: { id: 'gym_default_01' } });
    expect(defaultGym?.timezone).toBe('America/Los_Angeles');

    const f = await prisma.fighter.create({
      data: {
        published: true,
        name: 'F',
        summary: 'S',
        bio: 'B',
        disciplines: [],
        mediaUrls: [],
      },
      select: { id: true, gymId: true },
    });
    expect(f.gymId).toBe('gym_default_01');

    await closeTestApp(app);
  });
});

