import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    return await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { remindersEnabled: true, fighterNewBookingEnabled: true },
    });
  }

  async update(userId: string, dto: UpdateNotificationPreferencesDto) {
    await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        remindersEnabled: dto.remindersEnabled ?? true,
        fighterNewBookingEnabled: dto.fighterNewBookingEnabled ?? true,
      },
      update: {
        ...(dto.remindersEnabled === undefined ? {} : { remindersEnabled: dto.remindersEnabled }),
        ...(dto.fighterNewBookingEnabled === undefined
          ? {}
          : { fighterNewBookingEnabled: dto.fighterNewBookingEnabled }),
      },
    });

    return await this.getOrCreate(userId);
  }
}

