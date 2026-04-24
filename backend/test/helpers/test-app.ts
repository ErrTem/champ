import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { AppModule } from '../../src/app.module';

export type TestRequestAgent = ReturnType<typeof supertest.agent>;

export async function createTestApp(): Promise<{
  app: INestApplication;
  request: TestRequestAgent;
}> {
  process.env.NODE_ENV = 'test';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const request = supertest.agent(app.getHttpServer());
  return { app, request };
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

