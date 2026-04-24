import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';
import { createStripeSignatureHeader } from './helpers/stripe-webhook';

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

function devEmailLogs(calls: unknown[][]): string[] {
  return calls
    .map((args) => (typeof args[0] === 'string' ? (args[0] as string) : ''))
    .filter((m) => m.includes('[DEV EMAIL]'));
}

describe('Notifications (Booking status) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('NOT-01: confirming a booking via Stripe webhook emits exactly one dev-email log containing deep link (idempotent)', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    const user = await prisma.user.create({
      data: { email: 'n1@example.com', passwordHash: 'x' },
      select: { id: true, email: true },
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
      select: { id: true, name: true },
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
      select: { id: true, title: true },
    });
    const slot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2030-01-03T10:00:00.000Z'),
        endsAtUtc: new Date('2030-01-03T11:00:00.000Z'),
        reservedBookingId: 'temp',
        reservedUntilUtc: new Date('2030-01-03T10:05:00.000Z'),
      },
      select: { id: true },
    });
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slot.id,
        status: 'awaiting_payment',
        expiresAtUtc: new Date('2030-01-03T10:10:00.000Z'),
      },
      select: { id: true },
    });
    await prisma.slot.update({
      where: { id: slot.id },
      data: { reservedBookingId: booking.id },
      select: { id: true },
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_dummy';
    const payload = JSON.stringify({
      id: 'evt_notif_confirm_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1', metadata: { bookingId: booking.id } } },
    });
    const signature = createStripeSignatureHeader({ webhookSecret, payload });

    const { app, request } = await createTestApp();
    logSpy.mockClear();

    const first = await request
      .post('/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request
      .post('/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);
    expect(second.status).toBe(201);

    const logs = devEmailLogs(logSpy.mock.calls as unknown[][]);
    expect(logs).toHaveLength(1);
    expect(logs[0]!.includes(`/bookings/${booking.id}`)).toBe(true);

    await closeTestApp(app);
    logSpy.mockRestore();
  });

  it('NOT-02: expiring a stale awaiting-payment booking emits exactly one dev-email log containing deep link (idempotent)', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    const { app, request } = await createTestApp();
    const reg = await request
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'n2@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookie = cookieHeaderFromSetCookie((reg as any).headers?.['set-cookie']);
    expect(cookie).not.toBe('');

    const user = await prisma.user.findUnique({
      where: { email: 'n2@example.com' },
      select: { id: true, email: true },
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
      select: { id: true, name: true },
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
      select: { id: true, title: true },
    });
    const slot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2030-03-01T10:00:00.000Z'),
        endsAtUtc: new Date('2030-03-01T11:00:00.000Z'),
      },
      select: { id: true },
    });
    const booking = await prisma.booking.create({
      data: {
        userId: user!.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slot.id,
        status: 'awaiting_payment',
        expiresAtUtc: new Date('2000-01-01T00:00:00.000Z'),
      },
      select: { id: true },
    });

    logSpy.mockClear();
    const first = await request.get('/bookings').set('Cookie', cookie);
    expect(first.status).toBe(200);
    const second = await request.get('/bookings').set('Cookie', cookie);
    expect(second.status).toBe(200);

    const logs = devEmailLogs(logSpy.mock.calls as unknown[][]);
    expect(logs).toHaveLength(1);
    expect(logs[0]!.includes(`/bookings/${booking.id}`)).toBe(true);

    await closeTestApp(app);
    logSpy.mockRestore();
  });

  it('negative cases: no emit on booking creation, and no emit on Stripe cancel-like events', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    const { app, request } = await createTestApp();
    const reg = await request
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'neg@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookie = cookieHeaderFromSetCookie((reg as any).headers?.['set-cookie']);
    expect(cookie).not.toBe('');

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
    const slot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2030-05-01T10:00:00.000Z'),
        endsAtUtc: new Date('2030-05-01T11:00:00.000Z'),
      },
      select: { id: true },
    });

    logSpy.mockClear();
    const created = await request
      .post('/bookings')
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .send({ slotId: slot.id });
    expect(created.status).toBe(201);
    expect(devEmailLogs(logSpy.mock.calls as unknown[][])).toHaveLength(0);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_dummy';
    const payload = JSON.stringify({
      id: 'evt_notif_cancel_1',
      type: 'checkout.session.expired',
      data: { object: { id: 'cs_test_cancel', metadata: { bookingId: 'any' } } },
    });
    const signature = createStripeSignatureHeader({ webhookSecret, payload });

    logSpy.mockClear();
    const cancelLike = await request
      .post('/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);
    expect(cancelLike.status).toBe(201);
    expect(devEmailLogs(logSpy.mock.calls as unknown[][])).toHaveLength(0);

    await closeTestApp(app);
    logSpy.mockRestore();
  });
});

