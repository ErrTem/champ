import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import webpush, { WebPushError } from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class PushService {
  constructor(private readonly prisma: PrismaService) {}

  async listSubscriptions(userId: string) {
    return await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        deviceLabel: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
  }

  async upsertSubscription(userId: string, dto: UpsertPushSubscriptionDto) {
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint },
      select: { id: true },
    });

    if (existing) {
      return await this.prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          userId,
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userAgent: dto.userAgent,
          deviceLabel: dto.deviceLabel,
        },
        select: { id: true, endpoint: true, createdAt: true, updatedAt: true },
      });
    }

    return await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        deviceLabel: dto.deviceLabel,
      },
      select: { id: true, endpoint: true, createdAt: true, updatedAt: true },
    });
  }

  async deleteSubscription(userId: string, subscriptionId: string): Promise<void> {
    const row = await this.prisma.pushSubscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, userId: true },
    });
    if (!row) throw new NotFoundException();
    if (row.userId !== userId) throw new NotFoundException();

    await this.prisma.pushSubscription.delete({ where: { id: subscriptionId } });
  }

  async sendToUser(
    userId: string,
    payload: { type: string; bookingId: string; startAt: string; url?: string },
  ): Promise<void> {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) return;

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });

    const body = JSON.stringify(payload);
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (e) {
        const err = e as Partial<WebPushError> & { statusCode?: number };
        const status = err.statusCode;
        if (status === 404 || status === 410) {
          await this.prisma.pushSubscription.delete({ where: { id: s.id } });
        }
      }
    }
  }

  async assertUserIsAdmin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) throw new ForbiddenException();
  }
}

