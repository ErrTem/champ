import { PrismaClient } from '@prisma/client';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';

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

  it.todo('PAY-03: rejects webhook requests with missing/invalid Stripe signature (raw-body verification)');
  it.todo('PAY-04: is idempotent by Stripe event.id (duplicates do not double-confirm/consume)');
  it.todo('BKG-04: on checkout.session.completed, confirms booking and consumes slot atomically exactly once');
});

