import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedScheduleRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

type SeedService = {
  id: string;
  title: string;
  durationMinutes: number;
  modality: 'online' | 'in_person';
  priceCents: number;
  currency?: string;
  published?: boolean;
};

type SeedFighter = {
  id: string;
  name: string;
  summary: string;
  bio: string;
  photoUrl?: string;
  disciplines: string[];
  mediaUrls?: string[];
  wins?: number;
  losses?: number;
  draws?: number;
  yearsPro?: number;
  published?: boolean;
  services: SeedService[];
  scheduleRules?: SeedScheduleRule[];
};

const baselineScheduleRules: SeedScheduleRule[] = [
  // Mon–Fri: 09:00–12:00 and 17:00–20:00 (PT)
  ...[1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
    { dayOfWeek, startMinute: 9 * 60, endMinute: 12 * 60 },
    { dayOfWeek, startMinute: 17 * 60, endMinute: 20 * 60 },
  ]),
  // Sat: 10:00–14:00 (PT)
  { dayOfWeek: 6, startMinute: 10 * 60, endMinute: 14 * 60 },
];

const fighters: SeedFighter[] = [
  {
    id: 'ftr_ali_01',
    name: 'Alicia “Iron” Vega',
    summary: 'Technical striker with sharp footwork and calm pressure.',
    bio: 'Alicia is known for clean combinations, disciplined defense, and fight IQ. Sessions focus on striking fundamentals, timing, and building repeatable habits.',
    photoUrl: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=800&q=60',
    disciplines: ['Muay Thai', 'Boxing'],
    mediaUrls: [],
    wins: 12,
    losses: 3,
    draws: 1,
    yearsPro: 6,
    published: true,
    services: [
      { id: 'svc_ali_30_ol', title: '1:1 Striking (30 min)', durationMinutes: 30, modality: 'online', priceCents: 5000 },
      { id: 'svc_ali_60_ip', title: '1:1 Striking (60 min)', durationMinutes: 60, modality: 'in_person', priceCents: 9500 },
      { id: 'svc_ali_spar_ip', title: 'Light Sparring Fundamentals', durationMinutes: 60, modality: 'in_person', priceCents: 11000 },
    ],
    scheduleRules: baselineScheduleRules,
  },
  {
    id: 'ftr_noah_01',
    name: 'Noah “Lockdown” Kim',
    summary: 'Grappling-first fighter with elite control and transitions.',
    bio: 'Noah teaches efficient takedown chains, positional control, and high-percentage submissions. Great for beginners building confidence on the ground.',
    photoUrl: 'https://images.unsplash.com/photo-1599058917765-889172d3d66b?auto=format&fit=crop&w=800&q=60',
    disciplines: ['BJJ', 'Wrestling'],
    mediaUrls: [],
    wins: 9,
    losses: 2,
    draws: 0,
    yearsPro: 5,
    published: true,
    services: [
      { id: 'svc_noah_45_ol', title: 'BJJ Drills (45 min)', durationMinutes: 45, modality: 'online', priceCents: 6500 },
      { id: 'svc_noah_60_ip', title: 'Takedowns & Control (60 min)', durationMinutes: 60, modality: 'in_person', priceCents: 10500 },
    ],
    scheduleRules: baselineScheduleRules,
  },
  {
    id: 'ftr_maya_01',
    name: 'Maya “Pulse” Rios',
    summary: 'Conditioning + movement specialist for fight-ready fitness.',
    bio: 'Maya blends fight conditioning with movement quality. Sessions are tailored to your goals, whether it’s endurance, explosiveness, or return-to-training.',
    photoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60',
    disciplines: ['Strength & Conditioning'],
    mediaUrls: [],
    wins: 3,
    losses: 1,
    draws: 0,
    yearsPro: 2,
    published: true,
    services: [
      { id: 'svc_maya_30_ol', title: 'Fight Conditioning (30 min)', durationMinutes: 30, modality: 'online', priceCents: 4500 },
      { id: 'svc_maya_60_ip', title: 'Movement + Conditioning (60 min)', durationMinutes: 60, modality: 'in_person', priceCents: 9000 },
      { id: 'svc_maya_plan_ol', title: 'Training Plan Review', durationMinutes: 45, modality: 'online', priceCents: 7000, published: false },
    ],
    scheduleRules: baselineScheduleRules,
  },
  {
    id: 'ftr_sam_01',
    name: 'Sam “Southpaw” Okoye',
    summary: 'Creative southpaw striking and counterpunching.',
    bio: 'Sam focuses on angles, feints, and countering. Sessions cover stance-specific strategies and building a reliable gameplan you can execute under pressure.',
    photoUrl: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=800&q=60',
    disciplines: ['Kickboxing', 'Boxing'],
    mediaUrls: [],
    wins: 7,
    losses: 4,
    draws: 0,
    yearsPro: 4,
    published: true,
    services: [
      { id: 'svc_sam_30_ol', title: 'Southpaw Basics (30 min)', durationMinutes: 30, modality: 'online', priceCents: 4800 },
      { id: 'svc_sam_60_ip', title: 'Counters & Angles (60 min)', durationMinutes: 60, modality: 'in_person', priceCents: 9800 },
      { id: 'svc_sam_combo_ip', title: 'Combination Building', durationMinutes: 45, modality: 'in_person', priceCents: 8200 },
    ],
    scheduleRules: baselineScheduleRules,
  },
];

async function main() {
  for (const f of fighters) {
    const fighter = await prisma.fighter.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        published: f.published ?? true,
        name: f.name,
        summary: f.summary,
        bio: f.bio,
        photoUrl: f.photoUrl,
        disciplines: f.disciplines,
        mediaUrls: f.mediaUrls ?? [],
        wins: f.wins ?? 0,
        losses: f.losses ?? 0,
        draws: f.draws ?? 0,
        yearsPro: f.yearsPro ?? 0,
      },
      update: {
        published: f.published ?? true,
        name: f.name,
        summary: f.summary,
        bio: f.bio,
        photoUrl: f.photoUrl,
        disciplines: f.disciplines,
        mediaUrls: f.mediaUrls ?? [],
        wins: f.wins ?? 0,
        losses: f.losses ?? 0,
        draws: f.draws ?? 0,
        yearsPro: f.yearsPro ?? 0,
      },
    });

    const rules = f.scheduleRules ?? baselineScheduleRules;
    await prisma.fighterScheduleRule.deleteMany({ where: { fighterId: fighter.id } });
    await prisma.fighterScheduleRule.createMany({
      data: rules.map((r) => ({
        fighterId: fighter.id,
        dayOfWeek: r.dayOfWeek,
        startMinute: r.startMinute,
        endMinute: r.endMinute,
        active: true,
      })),
    });

    for (const s of f.services) {
      await prisma.service.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          fighterId: fighter.id,
          published: s.published ?? true,
          title: s.title,
          durationMinutes: s.durationMinutes,
          modality: s.modality,
          priceCents: s.priceCents,
          currency: s.currency ?? 'USD',
        },
        update: {
          fighterId: fighter.id,
          published: s.published ?? true,
          title: s.title,
          durationMinutes: s.durationMinutes,
          modality: s.modality,
          priceCents: s.priceCents,
          currency: s.currency ?? 'USD',
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

