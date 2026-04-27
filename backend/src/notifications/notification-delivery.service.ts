import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NOTIFICATION_TYPE_FIGHTER_NEW_BOOKING, NOTIFICATION_TYPE_REMINDER_24H } from './notification-types';

function truncateError(input: unknown): string {
  const msg = input instanceof Error ? input.message : typeof input === 'string' ? input : JSON.stringify(input);
  return msg.length > 500 ? msg.slice(0, 500) : msg;
}

@Injectable()
export class NotificationDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly prefs: NotificationPreferencesService,
  ) {}

  async sendFighterNewBooking(input: { bookingId: string; fighterUserId: string; startAtUtcIso: string }) {
    const pref = await this.prefs.getOrCreate(input.fighterUserId);
    if (!pref.fighterNewBookingEnabled) return;

    const scheduledFor = new Date();
    try {
      const row = await this.prisma.notificationDelivery.create({
        data: {
          userId: input.fighterUserId,
          bookingId: input.bookingId,
          type: NOTIFICATION_TYPE_FIGHTER_NEW_BOOKING,
          scheduledFor,
          status: 'pending',
        },
        select: { id: true },
      });

      await this.push.sendToUser(input.fighterUserId, {
        type: NOTIFICATION_TYPE_FIGHTER_NEW_BOOKING,
        bookingId: input.bookingId,
        startAt: input.startAtUtcIso,
        url: `/bookings/${encodeURIComponent(input.bookingId)}`,
      });

      await this.prisma.notificationDelivery.update({
        where: { id: row.id },
        data: { status: 'sent', attemptCount: { increment: 1 }, sentAt: new Date() },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return;
      await this.prisma.notificationDelivery.create({
        data: {
          userId: input.fighterUserId,
          bookingId: input.bookingId,
          type: NOTIFICATION_TYPE_FIGHTER_NEW_BOOKING,
          scheduledFor,
          status: 'failed',
          attemptCount: 1,
          lastError: truncateError(e),
        },
      });
    }
  }

  @Cron(process.env.REMINDER_SCAN_CRON ?? '*/5 * * * *')
  async scanAndSendReminder24h(): Promise<void> {
    const nowUtc = DateTime.utc();
    const scanMinutes = 5;

    const start = nowUtc.plus({ hours: 24 });
    const end = start.plus({ minutes: scanMinutes });

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        slot: { startsAtUtc: { gte: start.toJSDate(), lt: end.toJSDate() } },
      },
      select: {
        id: true,
        userId: true,
        slot: { select: { startsAtUtc: true } },
      },
      orderBy: [{ id: 'asc' }],
    });

    for (const b of bookings) {
      const pref = await this.prefs.getOrCreate(b.userId);
      if (!pref.remindersEnabled) continue;

      const scheduledFor = DateTime.fromJSDate(b.slot.startsAtUtc, { zone: 'utc' })
        .minus({ hours: 24 })
        .set({ second: 0, millisecond: 0 })
        .toJSDate();

      let deliveryId: string | null = null;
      try {
        const row = await this.prisma.notificationDelivery.create({
          data: {
            userId: b.userId,
            bookingId: b.id,
            type: NOTIFICATION_TYPE_REMINDER_24H,
            scheduledFor,
            status: 'pending',
          },
          select: { id: true },
        });
        deliveryId = row.id;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        continue;
      }

      try {
        await this.push.sendToUser(b.userId, {
          type: NOTIFICATION_TYPE_REMINDER_24H,
          bookingId: b.id,
          startAt: b.slot.startsAtUtc.toISOString(),
          url: `/bookings/${encodeURIComponent(b.id)}`,
        });

        await this.prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: { status: 'sent', attemptCount: { increment: 1 }, sentAt: new Date() },
        });
      } catch (e) {
        await this.prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'failed',
            attemptCount: { increment: 1 },
            lastError: truncateError(e),
          },
        });
      }
    }
  }
}

