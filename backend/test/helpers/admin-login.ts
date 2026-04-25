import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';

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

export async function registerAndLogin(args: {
  prisma: PrismaClient;
  agent: ReturnType<typeof supertest.agent>;
  email: string;
  password: string;
  isAdmin: boolean;
}): Promise<{ cookieHeader: string }> {
  const { prisma, agent, email, password, isAdmin } = args;

  const res = await agent
    .post('/auth/register')
    .set('Content-Type', 'application/json')
    .send({ email, password })
    .expect(201);

  const cookieHeader = cookieHeaderFromSetCookie((res as any).headers?.['set-cookie']);
  if (cookieHeader) {
    // Keep explicit cookie for tests that don't reuse same agent instance.
    agent.set('Cookie', cookieHeader);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin },
    });
  }

  return { cookieHeader };
}

