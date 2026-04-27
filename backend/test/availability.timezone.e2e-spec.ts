import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';

describe('Availability (Timezone) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('AV-TZ-01: response timezone is gym timezone; day bucketing uses gym-local date', async () => {
    const { app } = await createTestApp();
    const request = supertest(app.getHttpServer());

    const laGym = await prisma.gym.findUniqueOrThrow({ where: { id: 'gym_default_01' } });
    const nyGym = await prisma.gym.create({
      data: {
        id: 'gym_ny_01',
        name: 'NY Gym',
        timezone: 'America/New_York',
        addressLine1: '2 NY St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        countryCode: 'US',
      },
    });

    const laFighter = await prisma.fighter.create({
      data: {
        gymId: laGym.id,
        published: true,
        name: 'LA',
        summary: 'S',
        bio: 'B',
        disciplines: [],
        mediaUrls: [],
      },
      select: { id: true },
    });

    const nyFighter = await prisma.fighter.create({
      data: {
        gymId: nyGym.id,
        published: true,
        name: 'NY',
        summary: 'S',
        bio: 'B',
        disciplines: [],
        mediaUrls: [],
      },
      select: { id: true },
    });

    const laService = await prisma.service.create({
      data: {
        fighterId: laFighter.id,
        published: true,
        title: 'LA svc',
        durationMinutes: 60,
        modality: 'online',
        priceCents: 10000,
        currency: 'USD',
      },
      select: { id: true },
    });

    const nyService = await prisma.service.create({
      data: {
        fighterId: nyFighter.id,
        published: true,
        title: 'NY svc',
        durationMinutes: 60,
        modality: 'online',
        priceCents: 10000,
        currency: 'USD',
      },
      select: { id: true },
    });

    // Same UTC instant, different gym-local date.
    // 2026-01-01T07:00:00Z == 2025-12-31 23:00 (LA, UTC-8) and 2026-01-01 02:00 (NY, UTC-5)
    const startsAtUtc = new Date('2026-01-01T07:00:00.000Z');
    const endsAtUtc = new Date('2026-01-01T08:00:00.000Z');

    await prisma.slot.createMany({
      data: [
        { fighterId: laFighter.id, serviceId: laService.id, startsAtUtc, endsAtUtc },
        { fighterId: nyFighter.id, serviceId: nyService.id, startsAtUtc, endsAtUtc },
      ],
    });

    const fromDate = '2025-12-30';
    const days = 4;

    const laRes = await request
      .get('/availability')
      .query({ fighterId: laFighter.id, serviceId: laService.id, fromDate, days })
      .expect(200);
    expect(laRes.body.timezone).toBe('America/Los_Angeles');
    const laDays = laRes.body.days ?? [];
    const laSlotDay = laDays.find((d: { date: string }) => d.date === '2025-12-31');
    expect(laSlotDay?.slots?.length).toBe(1);

    const nyRes = await request
      .get('/availability')
      .query({ fighterId: nyFighter.id, serviceId: nyService.id, fromDate, days })
      .expect(200);
    expect(nyRes.body.timezone).toBe('America/New_York');
    const nyDays = nyRes.body.days ?? [];
    const nySlotDay = nyDays.find((d: { date: string }) => d.date === '2026-01-01');
    expect(nySlotDay?.slots?.length).toBe(1);

    await closeTestApp(app);
  });
});

