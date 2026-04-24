import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModuleBuilder } from '@nestjs/testing';
import supertest from 'supertest';
import { AppModule } from '../../src/app.module';

export type TestRequestAgent = ReturnType<typeof supertest.agent>;

export async function createTestApp(options?: {
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}): Promise<{
  app: INestApplication;
  request: TestRequestAgent;
}> {
  process.env.NODE_ENV = 'test';
  process.env.STRIPE_SECRET_KEY ??= 'sk_test_dummy';
  process.env.PUBLIC_APP_URL ??= 'http://localhost:8100';

  let builder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options?.configureModule) {
    builder = options.configureModule(builder);
  }

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const request = supertest.agent(app.getHttpServer());
  return { app, request };
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

