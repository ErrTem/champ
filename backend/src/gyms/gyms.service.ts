import { BadRequestException, Injectable } from '@nestjs/common';
import { IANAZone } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_GYM_ID = 'gym_default_01';
export const DEFAULT_GYM_NAME = 'Default Gym';
export const DEFAULT_GYM_TIMEZONE = 'America/Los_Angeles';

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  assertValidTimezone(timezone: string): void {
    const tz = timezone.trim();
    if (!tz.length || !IANAZone.isValidZone(tz)) {
      throw new BadRequestException('Invalid timezone');
    }
  }

  async getDefaultGym(): Promise<{ id: string; timezone: string }> {
    const gym = await this.prisma.gym.findFirst({
      where: { id: DEFAULT_GYM_ID },
      select: { id: true, timezone: true },
    });
    if (gym) return gym;

    const byName = await this.prisma.gym.findFirst({
      where: { name: DEFAULT_GYM_NAME },
      select: { id: true, timezone: true },
    });
    if (!byName) {
      // If DB exists without migration/seed, fail loud.
      throw new Error('Default gym missing');
    }
    return byName;
  }
}

