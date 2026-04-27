import { PrismaClient } from '@prisma/client';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { registerAndLogin } from './helpers/admin-login';
import { resetTestDb } from './helpers/test-db';

describe('Admin bookings — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('ADM-05: list filters (status, fighter, PT date range) and deterministic ordering', async () => {
    const { app, request } = await createTestApp();

    await registerAndLogin({
      prisma,
      agent: request,
      email: 'admin@example.com',
      password: 'Pass_12345678',
      isAdmin: true,
    });

    const user = await prisma.user.create({
      data: { email: 'u@example.com', passwordHash: 'x', name: 'U', isAdmin: false },
      select: { id: true },
    });

    const f1 = await prisma.fighter.create({
      data: { published: true, name: 'F1', summary: 'S', bio: 'B', disciplines: [], mediaUrls: [] },
      select: { id: true, name: true },
    });
    const f2 = await prisma.fighter.create({
      data: { published: true, name: 'F2', summary: 'S', bio: 'B', disciplines: [], mediaUrls: [] },
      select: { id: true, name: true },
    });

    const s1 = await prisma.service.create({
      data: {
        fighterId: f1.id,
        published: true,
        title: 'S1',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 100,
        currency: 'USD',
      },
      select: { id: true },
    });
    const s2 = await prisma.service.create({
      data: {
        fighterId: f2.id,
        published: true,
        title: 'S2',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 200,
        currency: 'USD',
      },
      select: { id: true },
    });

    // January = PST (UTC-8). PT day "2030-01-05" starts at 08:00Z.
    const slotA = await prisma.slot.create({
      data: {
        fighterId: f1.id,
        serviceId: s1.id,
        startsAtUtc: new Date('2030-01-05T08:30:00.000Z'),
        endsAtUtc: new Date('2030-01-05T09:30:00.000Z'),
      },
      select: { id: true },
    });
    const slotB = await prisma.slot.create({
      data: {
        fighterId: f1.id,
        serviceId: s1.id,
        startsAtUtc: new Date('2030-01-05T10:30:00.000Z'),
        endsAtUtc: new Date('2030-01-05T11:30:00.000Z'),
      },
      select: { id: true },
    });
    const slotC = await prisma.slot.create({
      data: {
        fighterId: f2.id,
        serviceId: s2.id,
        startsAtUtc: new Date('2030-01-06T08:30:00.000Z'),
        endsAtUtc: new Date('2030-01-06T09:30:00.000Z'),
      },
      select: { id: true },
    });

    const bA = await prisma.booking.create({
      data: {
        userId: user.id,
        fighterId: f1.id,
        serviceId: s1.id,
        slotId: slotA.id,
        status: 'confirmed',
        expiresAtUtc: new Date('2030-01-01T00:00:00.000Z'),
      },
      select: { id: true },
    });
    const bB = await prisma.booking.create({
      data: {
        userId: user.id,
        fighterId: f1.id,
        serviceId: s1.id,
        slotId: slotB.id,
        status: 'awaiting_payment',
        expiresAtUtc: new Date('2030-01-01T00:00:00.000Z'),
      },
      select: { id: true },
    });
    const bC = await prisma.booking.create({
      data: {
        userId: user.id,
        fighterId: f2.id,
        serviceId: s2.id,
        slotId: slotC.id,
        status: 'confirmed',
        expiresAtUtc: new Date('2030-01-01T00:00:00.000Z'),
      },
      select: { id: true },
    });

    const res = await request
      .get(`/admin/bookings?from=2030-01-05&to=2030-01-05&fighterId=${encodeURIComponent(f1.id)}`)
      .expect(200);

    const list = (res.body ?? []) as Array<{ id: string; startsAtUtc: string; fighter: { id: string } }>;
    expect(list.map((x) => x.id).sort()).toEqual([bA.id, bB.id].sort());
    expect(list.every((x) => x.fighter.id === f1.id)).toBe(true);

    // Status filter.
    const confirmedOnly = await request
      .get(`/admin/bookings?status=confirmed`)
      .expect(200);
    const idsConfirmed = (confirmedOnly.body ?? []).map((x: any) => String(x.id));
    expect(idsConfirmed).toContain(bA.id);
    expect(idsConfirmed).toContain(bC.id);
    expect(idsConfirmed).not.toContain(bB.id);

    // Deterministic ordering: startsAtUtc asc then id asc.
    const expected = [...list].sort((a, b) => {
      const at = new Date(a.startsAtUtc).getTime();
      const bt = new Date(b.startsAtUtc).getTime();
      if (at !== bt) return at - bt;
      return a.id.localeCompare(b.id);
    });
    expect(list.map((x) => x.id)).toEqual(expected.map((x) => x.id));

    // Detail endpoint exists.
    await request.get(`/admin/bookings/${encodeURIComponent(bA.id)}`).expect(200);

    await closeTestApp(app);
  });
});

