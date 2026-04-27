import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

const DEFAULT_GYM = {
  id: 'gym_default_01',
  name: 'Default Gym',
  timezone: 'America/Los_Angeles',
  addressLine1: '1 Default St',
  addressLine2: null as string | null,
  city: 'Los Angeles',
  state: 'CA',
  postalCode: '90001',
  countryCode: 'US',
};

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

const TEST_USER = {
  email: 'test@champ.local',
  password: 'Pass_12345678',
  name: 'Test User',
};

const TEST_FIGHTER_USER = {
  email: 'fighter@champ.local',
  password: 'Pass_12345678',
  name: 'Test Fighter',
};

const DEFAULT_DEV_ADMIN = {
  email: 'admin@example.com',
  password: 'adminadmin',
  name: 'Admin User',
};

function getEnv(key: string): string | undefined {
  const v = process.env[key];
  if (!v) return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
}

function generateSlotsForRules(args: {
  fighterId: string;
  serviceId: string;
  durationMinutes: number;
  rules: SeedScheduleRule[];
  days: number;
}): Array<{ fighterId: string; serviceId: string; startsAtUtc: Date; endsAtUtc: Date }> {
  const { fighterId, serviceId, durationMinutes, rules, days } = args;
  const tz = 'America/Los_Angeles';
  const stepMinutes = 30;
  const startLocal = DateTime.now().setZone(tz).startOf('day');
  const out: Array<{ fighterId: string; serviceId: string; startsAtUtc: Date; endsAtUtc: Date }> = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const dayLocal = startLocal.plus({ days: dayOffset }).startOf('day');
    const dayOfWeek = dayLocal.weekday % 7; // Luxon Mon..Sun (1..7) -> 0..6 (Sun..Sat)
    const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);

    for (const r of dayRules) {
      if (r.endMinute <= r.startMinute) continue;
      const windowStart = dayLocal.plus({ minutes: r.startMinute });
      const windowEnd = dayLocal.plus({ minutes: r.endMinute });
      let cursor = windowStart;

      while (cursor.plus({ minutes: durationMinutes }) <= windowEnd) {
        const endsLocal = cursor.plus({ minutes: durationMinutes });
        out.push({
          fighterId,
          serviceId,
          startsAtUtc: cursor.toUTC().toJSDate(),
          endsAtUtc: endsLocal.toUTC().toJSDate(),
        });
        cursor = cursor.plus({ minutes: stepMinutes });
      }
    }
  }

  return out;
}

async function main() {
  await prisma.gym.upsert({
    where: { id: DEFAULT_GYM.id },
    create: DEFAULT_GYM,
    update: {
      name: DEFAULT_GYM.name,
      timezone: DEFAULT_GYM.timezone,
      addressLine1: DEFAULT_GYM.addressLine1,
      addressLine2: DEFAULT_GYM.addressLine2,
      city: DEFAULT_GYM.city,
      state: DEFAULT_GYM.state,
      postalCode: DEFAULT_GYM.postalCode,
      countryCode: DEFAULT_GYM.countryCode,
    },
  });

  // Ensure a stable test login user exists for manual QA.
  const passwordHash = await bcrypt.hash(TEST_USER.password, 12);
  await prisma.user.upsert({
    where: { email: TEST_USER.email },
    create: {
      email: TEST_USER.email,
      passwordHash,
      name: TEST_USER.name,
    },
    update: {
      passwordHash,
      name: TEST_USER.name,
    },
  });

  // Ensure stable approved fighter user exists for manual QA.
  const fighterPasswordHash = await bcrypt.hash(TEST_FIGHTER_USER.password, 12);
  const fighterUser = await prisma.user.upsert({
    where: { email: TEST_FIGHTER_USER.email },
    create: {
      email: TEST_FIGHTER_USER.email,
      passwordHash: fighterPasswordHash,
      name: TEST_FIGHTER_USER.name,
      userType: 'fighter',
      fighterStatus: 'approved',
      fighterApprovedAt: DateTime.utc().toJSDate(),
      acceptedTermsAt: DateTime.utc().toJSDate(),
      confirmedAdultAt: DateTime.utc().toJSDate(),
    },
    update: {
      passwordHash: fighterPasswordHash,
      name: TEST_FIGHTER_USER.name,
      userType: 'fighter',
      fighterStatus: 'approved',
      fighterApprovedAt: DateTime.utc().toJSDate(),
      acceptedTermsAt: DateTime.utc().toJSDate(),
      confirmedAdultAt: DateTime.utc().toJSDate(),
    },
  });

  const adminEmail = getEnv('ADMIN_EMAIL');
  const adminPassword = getEnv('ADMIN_PASSWORD');
  const adminName = getEnv('ADMIN_NAME');
  const devDefaultAdminEnabled = process.env.NODE_ENV !== 'production' && !adminEmail && !adminPassword;
  if ((adminEmail && adminPassword) || devDefaultAdminEnabled) {
    const email = (adminEmail ?? DEFAULT_DEV_ADMIN.email).toLowerCase();
    const password = adminPassword ?? DEFAULT_DEV_ADMIN.password;
    const name = adminName ?? DEFAULT_DEV_ADMIN.name;
    const adminPasswordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: adminPasswordHash,
        name,
        isAdmin: true,
      },
      update: {
        passwordHash: adminPasswordHash,
        name,
        isAdmin: true,
      },
    });
  }

  for (const f of fighters) {
    const fighter = await prisma.fighter.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        gymId: DEFAULT_GYM.id,
        ...(f.id === 'ftr_ali_01' ? { userId: fighterUser.id } : {}),
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
        gymId: DEFAULT_GYM.id,
        ...(f.id === 'ftr_ali_01' ? { userId: fighterUser.id } : {}),
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

    // Pre-generate some slots for published services so dev app has availability without extra clicks.
    const publishedServices = f.services.filter((s) => s.published ?? true);
    for (const s of publishedServices) {
      const slots = generateSlotsForRules({
        fighterId: fighter.id,
        serviceId: s.id,
        durationMinutes: s.durationMinutes,
        rules,
        days: 14,
      });
      if (slots.length > 0) {
        await prisma.slot.createMany({ data: slots, skipDuplicates: true });
      }
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

