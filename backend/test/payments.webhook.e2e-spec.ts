import { PrismaClient } from '@prisma/client';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';
import { createStripeSignatureHeader } from './helpers/stripe-webhook';

describe('Payments (Stripe Webhook) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('boots the app (smoke)', async () => {
    const { app, request } = await createTestApp();
    const res = await request.get('/health');
    expect([200, 404]).toContain(res.status);
    await closeTestApp(app);
  });

  it('PAY-03: rejects webhook requests with invalid Stripe signature (raw-body verification)', async () => {
    const { app, request } = await createTestApp();

    const payload = JSON.stringify({
      id: 'evt_test_invalid_sig',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test', metadata: { bookingId: 'b' } } },
    });

    const res = await request
      .post('/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 't=1,v1=not-a-real-signature')
      .send(payload);

    expect(res.status).toBe(400);
    await closeTestApp(app);
  });

  it('PAY-04 + BKG-04: is idempotent by event.id and atomically confirms booking + consumes slot', async () => {
    const user = await prisma.user.create({
      data: { email: 'w@example.com', passwordHash: 'x' },
      select: { id: true },
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

    // align slot reservation to booking
    await prisma.slot.update({
      where: { id: slot.id },
      data: { reservedBookingId: booking.id },
      select: { id: true },
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_dummy';
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1', metadata: { bookingId: booking.id } } },
    });
    const signature = createStripeSignatureHeader({ webhookSecret, payload });

    const { app, request } = await createTestApp();

    const first = await request
      .post('/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);
    expect(first.status).toBe(201); // Nest default for POST

    const second = await request
      .post('/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);
    expect(second.status).toBe(201);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    expect(updatedBooking?.status).toBe('confirmed');

    const updatedSlot = await prisma.slot.findUnique({
      where: { id: slot.id },
      select: { confirmedBookingId: true, reservedBookingId: true, reservedUntilUtc: true },
    });
    expect(updatedSlot?.confirmedBookingId).toBe(booking.id);
    expect(updatedSlot?.reservedBookingId).toBeNull();
    expect(updatedSlot?.reservedUntilUtc).toBeNull();

    const events = await prisma.stripeWebhookEvent.findMany({
      where: { stripeEventId: 'evt_test_1' },
      select: { stripeEventId: true },
    });
    expect(events).toHaveLength(1);

    await closeTestApp(app);
  });
});

