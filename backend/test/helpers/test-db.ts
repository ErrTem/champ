import { PrismaClient } from '@prisma/client';

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
      "PasswordResetToken",
      "RefreshSession",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

