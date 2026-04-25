import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { registerAndLogin } from './helpers/admin-login';
import { resetTestDb } from './helpers/test-db';

type FighterListItem = { id: string; name: string };

describe('Admin fighters — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('ADM-02: published toggle immediately affects public /fighters', async () => {
    const { app, request } = await createTestApp();
    const nonAdminAgent = supertest.agent(app.getHttpServer());

    await registerAndLogin({
      prisma,
      agent: request,
      email: 'admin@example.com',
      password: 'Pass_12345678',
      isAdmin: true,
    });
    await registerAndLogin({
      prisma,
      agent: nonAdminAgent,
      email: 'user@example.com',
      password: 'Pass_12345678',
      isAdmin: false,
    });

    await nonAdminAgent
      .post('/admin/fighters')
      .set('Content-Type', 'application/json')
      .send({ name: 'Denied' })
      .expect(403);

    const created = await request
      .post('/admin/fighters')
      .set('Content-Type', 'application/json')
      .send({ name: 'Alpha', summary: 'S', bio: 'B', published: false, disciplines: [] })
      .expect(201);

    const fighterId = String(created.body?.id ?? '');
    expect(fighterId).not.toBe('');

    const publicBefore = await supertest(app.getHttpServer()).get('/fighters').expect(200);
    const listBefore = (publicBefore.body ?? []) as FighterListItem[];
    expect(listBefore.find((x) => x.id === fighterId)).toBeUndefined();

    await request
      .patch(`/admin/fighters/${encodeURIComponent(fighterId)}`)
      .set('Content-Type', 'application/json')
      .send({ published: true })
      .expect(200);

    const publicAfter = await supertest(app.getHttpServer()).get('/fighters').expect(200);
    const listAfter = (publicAfter.body ?? []) as FighterListItem[];
    expect(listAfter.find((x) => x.id === fighterId)).toBeTruthy();

    await closeTestApp(app);
  });
});

