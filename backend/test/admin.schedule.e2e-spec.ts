import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { registerAndLogin } from './helpers/admin-login';
import { resetTestDb } from './helpers/test-db';

describe('Admin schedule — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('ADM-04: regen never deletes confirmed slots or active holds', async () => {
    const { app, request } = await createTestApp();

    await registerAndLogin({
      prisma,
      agent: request,
      email: 'admin@example.com',
      password: 'Pass_12345678',
      isAdmin: true,
    });

    const fighter = await prisma.fighter.create({
      data: {
        published: true,
        name: 'F',
        summary: 'S',
        bio: 'B',
        disciplines: [],
        mediaUrls: [],
      },
      select: { id: true },
    });
    const service = await prisma.service.create({
      data: {
        fighterId: fighter.id,
        published: true,
        title: '1:1',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 1000,
        currency: 'USD',
      },
      select: { id: true },
    });

    const nowUtc = DateTime.utc();
    const starts1 = nowUtc.plus({ days: 2 }).toJSDate();
    const ends1 = nowUtc.plus({ days: 2, hours: 1 }).toJSDate();
    const confirmedSlot = await prisma.slot.create({
      data: { fighterId: fighter.id, serviceId: service.id, startsAtUtc: starts1, endsAtUtc: ends1 },
      select: { id: true },
    });
    const booking = await prisma.booking.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: 'u@example.com', passwordHash: 'x', isAdmin: false },
          select: { id: true },
        })).id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: confirmedSlot.id,
        status: 'confirmed',
        expiresAtUtc: nowUtc.plus({ minutes: 10 }).toJSDate(),
      },
      select: { id: true },
    });
    await prisma.slot.update({
      where: { id: confirmedSlot.id },
      data: { confirmedBookingId: booking.id },
    });

    const reservedSlot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: nowUtc.plus({ days: 3 }).toJSDate(),
        endsAtUtc: nowUtc.plus({ days: 3, hours: 1 }).toJSDate(),
        reservedBookingId: 'hold',
        reservedUntilUtc: nowUtc.plus({ minutes: 30 }).toJSDate(),
      },
      select: { id: true },
    });

    await request
      .put(`/admin/fighters/${encodeURIComponent(fighter.id)}/schedule-rules`)
      .set('Content-Type', 'application/json')
      .send({ rules: [] })
      .expect(200);

    const confirmedStill = await prisma.slot.findUnique({
      where: { id: confirmedSlot.id },
      select: { id: true },
    });
    const reservedStill = await prisma.slot.findUnique({
      where: { id: reservedSlot.id },
      select: { id: true },
    });

    expect(confirmedStill?.id).toBe(confirmedSlot.id);
    expect(reservedStill?.id).toBe(reservedSlot.id);

    await closeTestApp(app);
  });
});

