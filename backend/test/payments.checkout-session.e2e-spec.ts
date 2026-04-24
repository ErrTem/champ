import { Test } from '@nestjs/testing';
import type Stripe from 'stripe';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PaymentsService } from '../src/payments/payments.service';
import { StripeClient } from '../src/payments/stripe.client';
import { resetTestDb } from './helpers/test-db';

describe('Payments (Checkout Session) — e2e', () => {
  const stripeMock = {
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  } as unknown as Stripe;

  let prisma: PrismaService;
  let payments: PaymentsService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PUBLIC_APP_URL ??= 'http://localhost:8100';

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        PaymentsService,
        {
          provide: StripeClient,
          useValue: { stripe: stripeMock },
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    payments = moduleRef.get(PaymentsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await resetTestDb(prisma);
  });

  it('PAY-01: creates a Checkout Session with DB-authoritative amount and bookingId-only metadata', async () => {
    const user = await prisma.user.create({
      data: { email: 'u@example.com', passwordHash: 'x' },
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
        priceCents: 12345,
        currency: 'USD',
      },
      select: { id: true, priceCents: true },
    });
    const slot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2030-01-01T10:00:00.000Z'),
        endsAtUtc: new Date('2030-01-01T11:00:00.000Z'),
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
        expiresAtUtc: new Date('2030-01-01T10:10:00.000Z'),
      },
      select: { id: true },
    });

    stripeMock.checkout.sessions.create = jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
    });

    const result = await payments.createOrReuseCheckoutSession({
      bookingId: booking.id,
      userId: user.id,
    });

    expect(result.checkoutUrl).toBe('https://checkout.stripe.test/session');
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { bookingId: booking.id },
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: service.priceCents,
            }),
          }),
        ],
      }),
    );

    const updated = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { stripeCheckoutSessionId: true },
    });
    expect(updated?.stripeCheckoutSessionId).toBe('cs_test_123');
  });

  it('PAY-01: reuses the existing active session instead of creating another (one active session per booking)', async () => {
    const user = await prisma.user.create({
      data: { email: 'u2@example.com', passwordHash: 'x' },
      select: { id: true },
    });
    const fighter = await prisma.fighter.create({
      data: {
        published: true,
        name: 'F2',
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
        priceCents: 999,
        currency: 'USD',
      },
      select: { id: true },
    });
    const slot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2030-01-02T10:00:00.000Z'),
        endsAtUtc: new Date('2030-01-02T11:00:00.000Z'),
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
        expiresAtUtc: new Date('2030-01-02T10:10:00.000Z'),
        stripeCheckoutSessionId: 'cs_existing',
      },
      select: { id: true },
    });

    stripeMock.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
      id: 'cs_existing',
      status: 'open',
      url: 'https://checkout.stripe.test/existing',
    });
    stripeMock.checkout.sessions.create = jest.fn();

    const result = await payments.createOrReuseCheckoutSession({
      bookingId: booking.id,
      userId: user.id,
    });

    expect(result.checkoutUrl).toBe('https://checkout.stripe.test/existing');
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

