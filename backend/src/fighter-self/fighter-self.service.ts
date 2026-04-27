import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { ScheduleAdminService } from '../admin/schedule.admin.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { FighterSelfBookingListItemDto } from './dto/fighter-self-bookings.dto';
import type {
  CreateFighterSelfServiceDto,
  FighterSelfServiceDto,
  UpdateFighterSelfServiceDto,
} from './dto/fighter-self-service.dto';
import type { FighterSelfScheduleRuleDto } from './dto/fighter-self-schedule.dto';

@Injectable()
export class FighterSelfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduleAdmin: ScheduleAdminService,
    private readonly notifications: NotificationsService,
  ) {}

  async resolveCurrentFighterId(userId: string): Promise<string> {
    const fighter = await this.prisma.fighter.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!fighter) throw new ForbiddenException();
    return fighter.id;
  }

  async listScheduleRules(userId: string): Promise<FighterSelfScheduleRuleDto[]> {
    const fighterId = await this.resolveCurrentFighterId(userId);
    return this.scheduleAdmin.listRules(fighterId);
  }

  async replaceScheduleRules(userId: string, rules: FighterSelfScheduleRuleDto[]): Promise<{ ok: true }> {
    const fighterId = await this.resolveCurrentFighterId(userId);
    return this.scheduleAdmin.replaceRulesAndRegenerate({ fighterId, rules });
  }

  async listServices(userId: string): Promise<FighterSelfServiceDto[]> {
    const fighterId = await this.resolveCurrentFighterId(userId);
    const rows = await this.prisma.service.findMany({
      where: { fighterId },
      orderBy: [{ priceCents: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        fighterId: true,
        title: true,
        durationMinutes: true,
        modality: true,
        priceCents: true,
        currency: true,
        published: true,
      },
    });
    return rows.map((s) => ({
      id: s.id,
      fighterId: s.fighterId,
      title: s.title,
      durationMinutes: s.durationMinutes,
      modality: s.modality,
      priceCents: s.priceCents,
      currency: s.currency,
      published: s.published,
    }));
  }

  async createService(userId: string, dto: CreateFighterSelfServiceDto): Promise<FighterSelfServiceDto> {
    const fighterId = await this.resolveCurrentFighterId(userId);
    const created = await this.prisma.service.create({
      data: {
        fighterId,
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        modality: dto.modality,
        priceCents: dto.priceCents,
        currency: dto.currency ?? 'USD',
        published: dto.published ?? false,
      },
      select: {
        id: true,
        fighterId: true,
        title: true,
        durationMinutes: true,
        modality: true,
        priceCents: true,
        currency: true,
        published: true,
      },
    });
    return {
      id: created.id,
      fighterId: created.fighterId,
      title: created.title,
      durationMinutes: created.durationMinutes,
      modality: created.modality,
      priceCents: created.priceCents,
      currency: created.currency,
      published: created.published,
    };
  }

  async updateService(
    userId: string,
    serviceId: string,
    dto: UpdateFighterSelfServiceDto,
  ): Promise<FighterSelfServiceDto> {
    const fighterId = await this.resolveCurrentFighterId(userId);
    const existing = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, fighterId: true },
    });
    if (!existing) throw new NotFoundException('Service not found');
    if (existing.fighterId !== fighterId) throw new ForbiddenException();

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.modality !== undefined ? { modality: dto.modality } : {}),
        ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency ?? 'USD' } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
      },
      select: {
        id: true,
        fighterId: true,
        title: true,
        durationMinutes: true,
        modality: true,
        priceCents: true,
        currency: true,
        published: true,
      },
    });

    return {
      id: updated.id,
      fighterId: updated.fighterId,
      title: updated.title,
      durationMinutes: updated.durationMinutes,
      modality: updated.modality,
      priceCents: updated.priceCents,
      currency: updated.currency,
      published: updated.published,
    };
  }

  async listBookings(userId: string): Promise<FighterSelfBookingListItemDto[]> {
    const fighterId = await this.resolveCurrentFighterId(userId);
    const nowUtc = DateTime.utc().toJSDate();

    const bookings = await this.prisma.booking.findMany({
      where: { fighterId, slot: { startsAtUtc: { gte: nowUtc } } },
      select: {
        id: true,
        status: true,
        slot: { select: { startsAtUtc: true, endsAtUtc: true } },
        user: { select: { id: true, email: true, name: true } },
        service: { select: { id: true, title: true, priceCents: true, currency: true } },
      },
      orderBy: [{ slot: { startsAtUtc: 'asc' } }, { id: 'asc' }],
    });

    return bookings.map((b) => ({
      id: b.id,
      status: b.status,
      startsAtUtc: b.slot.startsAtUtc.toISOString(),
      endsAtUtc: b.slot.endsAtUtc.toISOString(),
      user: b.user,
      service: b.service,
    }));
  }

  async cancelBooking(args: { userId: string; bookingId: string; note?: string }): Promise<{ ok: true }> {
    const fighterId = await this.resolveCurrentFighterId(args.userId);
    const nowUtc = DateTime.utc().toJSDate();

    const booking = await this.prisma.booking.findFirst({
      where: { id: args.bookingId, fighterId },
      select: {
        id: true,
        status: true,
        stripeCheckoutSessionId: true,
        user: { select: { email: true } },
        fighter: { select: { name: true } },
        service: { select: { title: true } },
        slot: { select: { id: true, startsAtUtc: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.slot.startsAtUtc <= nowUtc) {
      throw new BadRequestException('Cannot cancel booking that already started');
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, fighterId },
        data: { status: 'cancelled_by_fighter' },
      });
      if (updated.count === 0) throw new NotFoundException('Booking not found');

      await tx.slot.updateMany({
        where: { id: booking.slot.id, confirmedBookingId: booking.id },
        data: { confirmedBookingId: null },
      });

      await tx.slot.updateMany({
        where: { id: booking.slot.id, reservedBookingId: booking.id },
        data: { reservedBookingId: null, reservedUntilUtc: null },
      });
    });

    const refundPolicy =
      booking.status === 'confirmed' && booking.stripeCheckoutSessionId ? 'manual' : 'not_applicable';

    this.notifications.notifyBookingCancelledByFighter({
      bookingId: booking.id,
      toEmail: booking.user.email,
      fighterName: booking.fighter.name,
      serviceTitle: booking.service.title,
      startsAtUtc: booking.slot.startsAtUtc,
      refundPolicy,
      note: args.note,
    });

    return { ok: true };
  }
}

