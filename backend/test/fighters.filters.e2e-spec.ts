import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import { closeTestApp, createTestApp } from './helpers/test-app';
import { resetTestDb } from './helpers/test-db';

type FighterListItem = {
  id: string;
  name: string;
  disciplines: string[];
  fromPriceCents: number | null;
};

describe('Fighters (Filters) — e2e', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  it('FF-01: GET /fighters filters by priceCents, discipline, modality; combined service constraints AND; stable ordering', async () => {
    const { app } = await createTestApp();
    const request = supertest(app.getHttpServer());

    const f1 = await prisma.fighter.create({
      data: {
        published: true,
        name: 'Alpha',
        summary: 'S',
        bio: 'B',
        disciplines: ['Boxing'],
        mediaUrls: [],
      },
      select: { id: true },
    });
    await prisma.service.createMany({
      data: [
        {
          fighterId: f1.id,
          published: true,
          title: 'A-online-cheap',
          durationMinutes: 60,
          modality: 'online',
          priceCents: 5000,
          currency: 'USD',
        },
        {
          fighterId: f1.id,
          published: true,
          title: 'A-inperson-exp',
          durationMinutes: 60,
          modality: 'in_person',
          priceCents: 15000,
          currency: 'USD',
        },
      ],
    });

    const f2 = await prisma.fighter.create({
      data: {
        published: true,
        name: 'Bravo',
        summary: 'S',
        bio: 'B',
        disciplines: ['MMA'],
        mediaUrls: [],
      },
      select: { id: true },
    });
    await prisma.service.createMany({
      data: [
        {
          fighterId: f2.id,
          published: true,
          title: 'B-inperson-mid',
          durationMinutes: 60,
          modality: 'in_person',
          priceCents: 9000,
          currency: 'USD',
        },
        {
          fighterId: f2.id,
          published: false,
          title: 'B-unpublished',
          durationMinutes: 60,
          modality: 'online',
          priceCents: 1,
          currency: 'USD',
        },
      ],
    });

    const f3 = await prisma.fighter.create({
      data: {
        published: true,
        name: 'Charlie',
        summary: 'S',
        bio: 'B',
        disciplines: ['Boxing', 'MMA'],
        mediaUrls: [],
      },
      select: { id: true },
    });
    await prisma.service.createMany({
      data: [
        {
          fighterId: f3.id,
          published: true,
          title: 'C-online-exp',
          durationMinutes: 60,
          modality: 'online',
          priceCents: 12000,
          currency: 'USD',
        },
      ],
    });

    const unpublished = await prisma.fighter.create({
      data: {
        published: false,
        name: 'Delta',
        summary: 'S',
        bio: 'B',
        disciplines: ['Boxing'],
        mediaUrls: [],
      },
      select: { id: true },
    });
    await prisma.service.createMany({
      data: [
        {
          fighterId: unpublished.id,
          published: true,
          title: 'D-online',
          durationMinutes: 60,
          modality: 'online',
          priceCents: 5000,
          currency: 'USD',
        },
      ],
    });

    const resAll = await request.get('/fighters').expect(200);
    const all = (resAll.body ?? []) as FighterListItem[];
    expect(all.map((x) => x.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);

    const resPrice = await request.get('/fighters').query({ minPriceCents: 8000, maxPriceCents: 13000 }).expect(200);
    const price = (resPrice.body ?? []) as FighterListItem[];
    expect(price.map((x) => x.name).sort()).toEqual(['Bravo', 'Charlie'].sort());

    const resDisc = await request.get('/fighters').query({ discipline: ['Boxing'] }).expect(200);
    const disc = (resDisc.body ?? []) as FighterListItem[];
    expect(disc.map((x) => x.name).sort()).toEqual(['Alpha', 'Charlie'].sort());

    const resMod = await request.get('/fighters').query({ modality: ['online'] }).expect(200);
    const mod = (resMod.body ?? []) as FighterListItem[];
    expect(mod.map((x) => x.name).sort()).toEqual(['Alpha', 'Charlie'].sort());

    // Combined: discipline Boxing + modality in_person + price <= 10000.
    // Alpha has in_person but 15000; Charlie no in_person; Bravo no Boxing.
    const resCombinedNone = await request
      .get('/fighters')
      .query({ discipline: ['Boxing'], modality: ['in_person'], maxPriceCents: 10000 })
      .expect(200);
    expect((resCombinedNone.body ?? []) as FighterListItem[]).toEqual([]);

    // Combined that matches Alpha via single service-level AND (online + 5000).
    const resCombinedYes = await request
      .get('/fighters')
      .query({ discipline: ['Boxing'], modality: ['online'], maxPriceCents: 6000 })
      .expect(200);
    const combinedYes = (resCombinedYes.body ?? []) as FighterListItem[];
    expect(combinedYes.map((x) => x.name)).toEqual(['Alpha']);

    await closeTestApp(app);
  });
});

