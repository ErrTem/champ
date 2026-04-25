import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { registerAndLogin } from './helpers/admin-login';
import { resetTestDb } from './helpers/test-db';

describe('Admin authz — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('ADM-01: non-admin is 403 on /admin; admin is allowed', async () => {
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

    await nonAdminAgent.get('/admin/ping').expect(403);
    await nonAdminAgent.get('/admin/fighters').expect(403);

    await request.get('/admin/ping').expect(200);
    await request.get('/admin/fighters').expect(200);

    await closeTestApp(app);
  });
});

