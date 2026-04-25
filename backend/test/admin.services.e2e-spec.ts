import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { registerAndLogin } from './helpers/admin-login';
import { resetTestDb } from './helpers/test-db';

type PublicFighterProfile = { id: string; services: Array<{ id: string; priceCents: number }> };

describe('Admin services — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('ADM-03: service publish + price updates reflect immediately in public profile', async () => {
    const { app, request } = await createTestApp();

    await registerAndLogin({
      prisma,
      agent: request,
      email: 'admin@example.com',
      password: 'Pass_12345678',
      isAdmin: true,
    });

    const fighterRes = await request
      .post('/admin/fighters')
      .set('Content-Type', 'application/json')
      .send({ name: 'F', summary: 'S', bio: 'B', published: true, disciplines: [] })
      .expect(201);
    const fighterId = String(fighterRes.body?.id ?? '');
    expect(fighterId).not.toBe('');

    const created = await request
      .post(`/admin/fighters/${encodeURIComponent(fighterId)}/services`)
      .set('Content-Type', 'application/json')
      .send({
        title: '1:1',
        durationMinutes: 60,
        modality: 'in_person',
        priceCents: 12345,
        currency: 'USD',
        published: false,
      })
      .expect(201);
    const serviceId = String(created.body?.id ?? '');
    expect(serviceId).not.toBe('');

    const publicBefore = await supertest(app.getHttpServer())
      .get(`/fighters/${encodeURIComponent(fighterId)}`)
      .expect(200);
    const profBefore = publicBefore.body as PublicFighterProfile;
    expect(profBefore.services.find((s) => s.id === serviceId)).toBeUndefined();

    await request
      .patch(`/admin/services/${encodeURIComponent(serviceId)}`)
      .set('Content-Type', 'application/json')
      .send({ published: true })
      .expect(200);

    await request
      .patch(`/admin/services/${encodeURIComponent(serviceId)}`)
      .set('Content-Type', 'application/json')
      .send({ priceCents: 999 })
      .expect(200);

    const publicAfter = await supertest(app.getHttpServer())
      .get(`/fighters/${encodeURIComponent(fighterId)}`)
      .expect(200);
    const profAfter = publicAfter.body as PublicFighterProfile;
    const svc = profAfter.services.find((s) => s.id === serviceId);
    expect(svc).toBeTruthy();
    expect(svc?.priceCents).toBe(999);

    await closeTestApp(app);
  });
});

