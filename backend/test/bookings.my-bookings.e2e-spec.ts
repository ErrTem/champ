import { PrismaClient } from '@prisma/client';
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

type BookingListItem = {
  id: string;
  status: string;
  expiresAtUtc: string;
  startsAtUtc: string;
  endsAtUtc: string;
  fighterId: string;
  fighterName: string;
  serviceId: string;
  serviceTitle: string;
  priceCents: number;
  currency: string;
  paymentState: string;
};

describe('Bookings (My bookings) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('MBB-01: GET /bookings is auth-scoped, deterministic ordered, includes fields for Upcoming/Past split', async () => {
    const { app, request } = await createTestApp();
    const otherAgent = supertest.agent(app.getHttpServer());

    const regA = await request
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'a@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookieA = cookieHeaderFromSetCookie((regA as any).headers?.['set-cookie']);
    expect(cookieA).not.toBe('');
    expect(cookieA.includes('access_token=')).toBe(true);

    const regB = await otherAgent
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'b@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookieB = cookieHeaderFromSetCookie((regB as any).headers?.['set-cookie']);
    expect(cookieB).not.toBe('');
    expect(cookieB.includes('access_token=')).toBe(true);

    const userA = await prisma.user.findUnique({
      where: { email: 'a@example.com' },
      select: { id: true },
    });
    const userB = await prisma.user.findUnique({
      where: { email: 'b@example.com' },
      select: { id: true },
    });
    expect(userA?.id).toBeTruthy();
    expect(userB?.id).toBeTruthy();

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
        priceCents: 12345,
        currency: 'USD',
      },
      select: { id: true, title: true, priceCents: true, currency: true },
    });

    const fighter2 = await prisma.fighter.create({
      data: {
        published: true,
        name: 'F2',
        summary: 'S',
        bio: 'B',
        disciplines: [],
        mediaUrls: [],
      },
      select: { id: true, name: true },
    });
    const service2 = await prisma.service.create({
      data: {
        fighterId: fighter2.id,
        published: true,
        title: '2:2',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 888,
        currency: 'USD',
      },
      select: { id: true, title: true, priceCents: true, currency: true },
    });

    const startsSame = new Date('2030-01-01T10:00:00.000Z');
    const endsSame = new Date('2030-01-01T11:00:00.000Z');
    const slot1 = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: startsSame,
        endsAtUtc: endsSame,
      },
      select: { id: true },
    });
    const slot2 = await prisma.slot.create({
      data: {
        fighterId: fighter2.id,
        serviceId: service2.id,
        startsAtUtc: startsSame,
        endsAtUtc: endsSame,
      },
      select: { id: true },
    });
    const slotPast = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2029-01-01T10:00:00.000Z'),
        endsAtUtc: new Date('2029-01-01T11:00:00.000Z'),
      },
      select: { id: true },
    });

    const b1 = await prisma.booking.create({
      data: {
        userId: userA!.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slot1.id,
        status: 'awaiting_payment',
        expiresAtUtc: new Date('2030-01-01T10:10:00.000Z'),
        stripeCheckoutSessionId: 'cs_test_1',
      },
      select: { id: true },
    });
    const b2 = await prisma.booking.create({
      data: {
        userId: userA!.id,
        fighterId: fighter2.id,
        serviceId: service2.id,
        slotId: slot2.id,
        status: 'confirmed',
        expiresAtUtc: new Date('2030-01-01T10:10:00.000Z'),
      },
      select: { id: true },
    });
    await prisma.booking.create({
      data: {
        userId: userA!.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slotPast.id,
        status: 'confirmed',
        expiresAtUtc: new Date('2030-01-01T10:10:00.000Z'),
      },
      select: { id: true },
    });

    await prisma.booking.create({
      data: {
        userId: userB!.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slotPast.id,
        status: 'confirmed',
        expiresAtUtc: new Date('2030-01-01T10:10:00.000Z'),
      },
      select: { id: true },
    });

    const res = await request.get('/bookings').set('Cookie', cookieA);
    expect(res.status).toBe(200);

    const list = (res.body ?? []) as BookingListItem[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.every((x) => x && typeof x.id === 'string')).toBe(true);

    // Auth scoping: only user A bookings.
    const ids = list.map((x) => x.id);
    expect(ids).toContain(b1.id);
    expect(ids).toContain(b2.id);

    // Deterministic contract: full list sorted by startsAtUtc asc, then id asc.
    const expected = [...list].sort((a, b) => {
      const at = new Date(a.startsAtUtc).getTime();
      const bt = new Date(b.startsAtUtc).getTime();
      if (at !== bt) return at - bt;
      return a.id.localeCompare(b.id);
    });
    expect(list.map((x) => x.id)).toEqual(expected.map((x) => x.id));

    // UI contract: row fields for scan + split + tie-break.
    const first = list[0]!;
    expect(typeof first.startsAtUtc).toBe('string');
    expect(typeof first.endsAtUtc).toBe('string');
    expect(typeof first.status).toBe('string');
    expect(typeof first.expiresAtUtc).toBe('string');
    expect(typeof first.fighterId).toBe('string');
    expect(typeof first.fighterName).toBe('string');
    expect(typeof first.serviceId).toBe('string');
    expect(typeof first.serviceTitle).toBe('string');
    expect(typeof first.priceCents).toBe('number');
    expect(typeof first.currency).toBe('string');
    expect(typeof first.paymentState).toBe('string');

    await closeTestApp(app);
  });

  it('MBB-02: GET /bookings/:id is user-scoped (404 for other user) and returns enriched detail fields', async () => {
    const { app, request } = await createTestApp();
    const otherAgent = supertest.agent(app.getHttpServer());

    const regA = await request
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'a2@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookieA = cookieHeaderFromSetCookie((regA as any).headers?.['set-cookie']);
    expect(cookieA).not.toBe('');
    expect(cookieA.includes('access_token=')).toBe(true);

    const regB = await otherAgent
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'b2@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookieB = cookieHeaderFromSetCookie((regB as any).headers?.['set-cookie']);
    expect(cookieB).not.toBe('');
    expect(cookieB.includes('access_token=')).toBe(true);

    const userA = await prisma.user.findUnique({
      where: { email: 'a2@example.com' },
      select: { id: true },
    });
    const userB = await prisma.user.findUnique({
      where: { email: 'b2@example.com' },
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
      select: { id: true, name: true },
    });
    const service = await prisma.service.create({
      data: {
        fighterId: fighter.id,
        published: true,
        title: '1:1',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 111,
        currency: 'USD',
      },
      select: { id: true, title: true, priceCents: true, currency: true },
    });
    const slot = await prisma.slot.create({
      data: {
        fighterId: fighter.id,
        serviceId: service.id,
        startsAtUtc: new Date('2030-02-01T10:00:00.000Z'),
        endsAtUtc: new Date('2030-02-01T11:00:00.000Z'),
      },
      select: { id: true },
    });

    const bookingA = await prisma.booking.create({
      data: {
        userId: userA!.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slot.id,
        status: 'awaiting_payment',
        expiresAtUtc: new Date('2030-02-01T10:10:00.000Z'),
      },
      select: { id: true },
    });
    const bookingB = await prisma.booking.create({
      data: {
        userId: userB!.id,
        fighterId: fighter.id,
        serviceId: service.id,
        slotId: slot.id,
        status: 'awaiting_payment',
        expiresAtUtc: new Date('2030-02-01T10:10:00.000Z'),
      },
      select: { id: true },
    });

    const denied = await request
      .get(`/bookings/${encodeURIComponent(bookingB.id)}`)
      .set('Cookie', cookieA);
    expect(denied.status).toBe(404);

    const ok = await request.get(`/bookings/${encodeURIComponent(bookingA.id)}`).set('Cookie', cookieA);
    expect(ok.status).toBe(200);

    const body = ok.body as Record<string, unknown>;
    expect(body.id).toBe(bookingA.id);
    expect(body.status).toBe('awaiting_payment');
    expect(typeof body.expiresAtUtc).toBe('string');

    // Enriched detail contract for Phase 05 UI.
    expect(body.fighterId).toBe(fighter.id);
    expect(body.fighterName).toBe(fighter.name);
    expect(body.serviceId).toBe(service.id);
    expect(body.serviceTitle).toBe(service.title);
    expect(body.priceCents).toBe(service.priceCents);
    expect(body.currency).toBe(service.currency);
    expect(typeof body.paymentState).toBe('string');
    expect(typeof body.startsAtUtc).toBe('string');
    expect(typeof body.endsAtUtc).toBe('string');

    await closeTestApp(app);
  });

  it("expiry classification: awaiting_payment with expiresAtUtc in past returns status='expired' in list and detail", async () => {
    const { app, request } = await createTestApp();

    const reg = await request
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email: 'exp@example.com', password: 'Pass_12345678' })
      .expect(201);
    const cookie = cookieHeaderFromSetCookie((reg as any).headers?.['set-cookie']);
    expect(cookie).not.toBe('');
    expect(cookie.includes('access_token=')).toBe(true);

    const user = await prisma.user.findUnique({
      where: { email: 'exp@example.com' },
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

    const listRes = await request.get('/bookings').set('Cookie', cookie);
    expect(listRes.status).toBe(200);
    const list = (listRes.body ?? []) as Array<{ id: string; status: string }>;
    const item = list.find((x) => x.id === booking.id);
    expect(item?.status).toBe('expired');

    const detailRes = await request.get(`/bookings/${encodeURIComponent(booking.id)}`).set('Cookie', cookie);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body?.status).toBe('expired');

    await closeTestApp(app);
  });
});

