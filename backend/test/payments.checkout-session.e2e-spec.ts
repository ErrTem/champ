import { PrismaClient } from '@prisma/client';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';

describe('Payments (Checkout Session) — e2e', () => {
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

  it.todo(
    'PAY-01: creates or reuses exactly one active Stripe Checkout Session per awaiting-payment booking (DB-authoritative amount, metadata bookingId only)',
  );
});

