import { PrismaClient } from '@prisma/client';

const DEFAULT_GYM_ID = 'gym_default_01';

export async function resetTestDb(prisma: PrismaClient): Promise<void> {
  // Keep this fast and deterministic. We intentionally truncate the domain tables
  // used in booking/payment flows; auth tables are left alone unless needed.
  // NOTE: Prisma $transaction([...deleteMany]) can still hit FK ordering issues
  // under concurrent Jest workers. TRUNCATE ... CASCADE is deterministic.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "StripeWebhookEvent",
      "Booking",
      "Slot",
      "FighterScheduleRule",
      "Service",
      "Fighter",
      "Gym",
      "PasswordResetToken",
      "RefreshSession",
      "User"
    RESTART IDENTITY CASCADE
  `);

  // Ensure deterministic "default gym" exists for tests that create fighters without specifying gymId.
  await prisma.gym.upsert({
    where: { id: DEFAULT_GYM_ID },
    create: {
      id: DEFAULT_GYM_ID,
      name: 'Default Gym',
      timezone: 'America/Los_Angeles',
      addressLine1: '1 Default St',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      countryCode: 'US',
    },
    update: {
      name: 'Default Gym',
      timezone: 'America/Los_Angeles',
    },
  });
}

