import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';

function cookieHeaderFromSetCookie(setCookies: unknown): string {
  const arr =
    typeof setCookies === 'string'
      ? [setCookies]
      : Array.isArray(setCookies) && setCookies.every((x) => typeof x === 'string')
        ? (setCookies as string[])
        : [];
  const parts = arr.map((c) => c.split(';')[0]?.trim()).filter(Boolean);
  return parts.join('; ');
}

describe('Bookings (24h rule) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('B24-01: POST /bookings rejects slots starting <24h with stable 400 {code}', async () => {
    const { app } = await createTestApp();
    const request = supertest(app.getHttpServer());

    const reg = await request
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'u24@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookie = cookieHeaderFromSetCookie((reg as any).headers?.['set-cookie']);
    expect(cookie).not.toBe('');
    expect(cookie.includes('access_token=')).toBe(true);

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
        priceCents: 12345,
        currency: 'USD',
      },
      select: { id: true },
    });

    const now = DateTime.utc();
    const startsNear = now.plus({ hours: 2 }).toJSDate();
    const endsNear = now.plus({ hours: 3 }).toJSDate();
    const startsFar = now.plus({ hours: 26 }).toJSDate();
    const endsFar = now.plus({ hours: 27 }).toJSDate();

    const nearSlot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: startsNear,
        endsAtUtc: endsNear,
      },
      select: { id: true },
    });
    const farSlot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: startsFar,
        endsAtUtc: endsFar,
      },
      select: { id: true },
    });

    const tooSoon = await request
      .post('/bookings')
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send({ slotId: nearSlot.id });
    expect(tooSoon.status).toBe(400);
    expect(tooSoon.body?.code).toBe('BOOKING_TOO_SOON');
    expect(typeof tooSoon.body?.message).toBe('string');

    const ok = await request
      .post('/bookings')
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send({ slotId: farSlot.id })
      .expect(201);
    expect(typeof ok.body?.id).toBe('string');
    expect(ok.body?.status).toBe('awaiting_payment');

    await closeTestApp(app);
  });
});

