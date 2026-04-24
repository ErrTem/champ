import { PrismaClient } from '@prisma/client';

export async function resetTestDb(prisma: PrismaClient): Promise<void> {
  // Keep this fast and deterministic. We intentionally truncate the domain tables
  // used in booking/payment flows; auth tables are left alone unless needed.
  await prisma.$transaction([
    prisma.booking.deleteMany(),
    prisma.slot.deleteMany(),
    prisma.fighterScheduleRule.deleteMany(),
    prisma.service.deleteMany(),
    prisma.fighter.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.refreshSession.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

