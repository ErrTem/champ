import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { BOOKING_HOLD_TTL_MINUTES, BOOKING_TOO_SOON_CODE, SLOT_UNAVAILABLE_CODE } from './bookings.constants';
import { BookingDto, BookingListItemDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private paymentStateFromBooking(input: { status: string }): string {
    if (input.status === 'confirmed') return 'paid';
    if (input.status === 'expired') return 'expired';
    return 'unpaid';
  }

  private async expireStaleAwaitingPaymentBookingsForUser(userId: string): Promise<void> {
    const nowUtc = DateTime.utc().toJSDate();
    const candidates = await this.prisma.booking.findMany({
      where: { userId, status: 'awaiting_payment', expiresAtUtc: { lt: nowUtc } },
      select: { id: true },
      orderBy: [{ id: 'asc' }],
    });

    const transitioned: string[] = [];
    for (const c of candidates) {
      const didExpire = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.booking.updateMany({
          where: { id: c.id, userId, status: 'awaiting_payment', expiresAtUtc: { lt: nowUtc } },
          data: { status: 'expired' },
        });
        if (updated.count === 0) return false;

        await tx.slot.updateMany({
          where: {
            reservedBookingId: c.id,
            OR: [{ confirmedBookingId: null }, { confirmedBookingId: c.id }],
          },
          data: { reservedBookingId: null, reservedUntilUtc: null },
        });
        return true;
      });
      if (didExpire) transitioned.push(c.id);
    }

    if (transitioned.length === 0) return;

    const rows = await this.prisma.booking.findMany({
      where: { id: { in: transitioned } },
      select: {
        id: true,
        user: { select: { email: true } },
        fighter: { select: { name: true } },
        service: { select: { title: true } },
        slot: { select: { startsAtUtc: true } },
      },
      orderBy: [{ id: 'asc' }],
    });

    for (const b of rows) {
      this.notifications.notifyBookingExpiredHold({
        bookingId: b.id,
        toEmail: b.user.email,
        fighterName: b.fighter.name,
        serviceTitle: b.service.title,
        startsAtUtc: b.slot.startsAtUtc,
      });
    }
  }

  async getMyBookings(input: { userId: string }): Promise<BookingListItemDto[]> {
    await this.expireStaleAwaitingPaymentBookingsForUser(input.userId);

    const bookings = await this.prisma.booking.findMany({
      where: { userId: input.userId },
      select: {
        id: true,
        status: true,
        expiresAtUtc: true,
        slot: { select: { startsAtUtc: true, endsAtUtc: true } },
        fighter: { select: { id: true, name: true } },
        service: { select: { id: true, title: true, priceCents: true, currency: true } },
      },
      orderBy: [{ slot: { startsAtUtc: 'asc' } }, { id: 'asc' }],
    });

    return bookings.map((b) => ({
      id: b.id,
      status: b.status,
      expiresAtUtc: b.expiresAtUtc.toISOString(),
      startsAtUtc: b.slot.startsAtUtc.toISOString(),
      endsAtUtc: b.slot.endsAtUtc.toISOString(),
      fighterId: b.fighter.id,
      fighterName: b.fighter.name,
      serviceId: b.service.id,
      serviceTitle: b.service.title,
      priceCents: b.service.priceCents,
      currency: b.service.currency,
      paymentState: this.paymentStateFromBooking({ status: b.status }),
    }));
  }

  async getBookingForUser(input: { bookingId: string; userId: string }): Promise<BookingDto> {
    await this.expireStaleAwaitingPaymentBookingsForUser(input.userId);

    const booking = await this.prisma.booking.findFirst({
      where: { id: input.bookingId, userId: input.userId },
      select: {
        id: true,
        status: true,
        expiresAtUtc: true,
        slot: {
          select: {
            id: true,
            startsAtUtc: true,
            endsAtUtc: true,
            fighterId: true,
            serviceId: true,
          },
        },
        fighter: { select: { id: true, name: true } },
        service: { select: { id: true, title: true, priceCents: true, currency: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: booking.id,
      status: booking.status,
      expiresAtUtc: booking.expiresAtUtc.toISOString(),
      slot: {
        slotId: booking.slot.id,
        startsAtUtc: booking.slot.startsAtUtc.toISOString(),
        endsAtUtc: booking.slot.endsAtUtc.toISOString(),
        fighterId: booking.slot.fighterId,
        serviceId: booking.slot.serviceId,
      },
      startsAtUtc: booking.slot.startsAtUtc.toISOString(),
      endsAtUtc: booking.slot.endsAtUtc.toISOString(),
      fighterId: booking.fighter.id,
      fighterName: booking.fighter.name,
      serviceId: booking.service.id,
      serviceTitle: booking.service.title,
      priceCents: booking.service.priceCents,
      currency: booking.service.currency,
      paymentState: this.paymentStateFromBooking({ status: booking.status }),
    };
  }

  async createBooking(input: { userId: string; slotId: string }): Promise<BookingDto> {
    const { userId, slotId } = input;

    const nowUtc = DateTime.utc().toJSDate();
    const expiresAtUtc = new Date(nowUtc.getTime() + BOOKING_HOLD_TTL_MINUTES * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        select: {
          id: true,
          startsAtUtc: true,
          endsAtUtc: true,
          fighterId: true,
          serviceId: true,
        },
      });

      if (!slot) throw new NotFoundException('Slot not found');

      const startsAtUtcMs = DateTime.fromJSDate(slot.startsAtUtc, { zone: 'utc' }).toMillis();
      const nowUtcMs = DateTime.fromJSDate(nowUtc, { zone: 'utc' }).toMillis();
      const diffMs = startsAtUtcMs - nowUtcMs;
      const minLeadMs = 24 * 60 * 60 * 1000;
      if (diffMs < minLeadMs) {
        throw new BadRequestException({
          code: BOOKING_TOO_SOON_CODE,
          message: 'Bookings must be made at least 24 hours in advance.',
        });
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          fighterId: slot.fighterId,
          serviceId: slot.serviceId,
          slotId: slot.id,
          status: 'awaiting_payment',
          expiresAtUtc,
        },
        select: { id: true, status: true, expiresAtUtc: true },
      });

      const reservation = await tx.slot.updateMany({
        where: {
          id: slot.id,
          confirmedBookingId: null,
          OR: [{ reservedUntilUtc: null }, { reservedUntilUtc: { lt: nowUtc } }],
        },
        data: {
          reservedUntilUtc: booking.expiresAtUtc,
          reservedBookingId: booking.id,
        },
      });

      if (reservation.count === 0) {
        throw new ConflictException({ code: SLOT_UNAVAILABLE_CODE });
      }

      return {
        id: booking.id,
        status: booking.status,
        expiresAtUtc: booking.expiresAtUtc.toISOString(),
        slot: {
          slotId: slot.id,
          startsAtUtc: slot.startsAtUtc.toISOString(),
          endsAtUtc: slot.endsAtUtc.toISOString(),
          fighterId: slot.fighterId,
          serviceId: slot.serviceId,
        },
      };
    });
  }
}

