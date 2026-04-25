import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AVAILABILITY_TIMEZONE } from '../availability/availability.constants';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminBookingDetailDto,
  AdminBookingListItemDto,
  AdminBookingsQueryDto,
} from './dto/admin-bookings.dto';

function parsePtDateBounds(args: { from?: string; to?: string }): {
  fromUtc?: Date;
  toUtcExclusive?: Date;
} {
  const { from, to } = args;
  const out: { fromUtc?: Date; toUtcExclusive?: Date } = {};

  if (from) {
    const startLocal = DateTime.fromISO(from, { zone: AVAILABILITY_TIMEZONE }).startOf('day');
    if (!startLocal.isValid) throw new BadRequestException('Invalid from');
    out.fromUtc = startLocal.toUTC().toJSDate();
  }

  if (to) {
    const endLocalExclusive = DateTime.fromISO(to, { zone: AVAILABILITY_TIMEZONE })
      .startOf('day')
      .plus({ days: 1 });
    if (!endLocalExclusive.isValid) throw new BadRequestException('Invalid to');
    out.toUtcExclusive = endLocalExclusive.toUTC().toJSDate();
  }

  return out;
}

@Injectable()
export class BookingsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminBookingsQueryDto): Promise<AdminBookingListItemDto[]> {
    const { fromUtc, toUtcExclusive } = parsePtDateBounds({ from: query.from, to: query.to });

    const bookings = await this.prisma.booking.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.fighterId ? { fighterId: query.fighterId } : {}),
        ...(fromUtc || toUtcExclusive
          ? {
              slot: {
                startsAtUtc: {
                  ...(fromUtc ? { gte: fromUtc } : {}),
                  ...(toUtcExclusive ? { lt: toUtcExclusive } : {}),
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        slot: { select: { startsAtUtc: true } },
        fighter: { select: { id: true, name: true } },
        service: { select: { id: true, title: true, priceCents: true, currency: true } },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: [{ slot: { startsAtUtc: 'asc' } }, { id: 'asc' }],
    });

    return bookings.map((b) => ({
      id: b.id,
      status: b.status,
      startsAtUtc: b.slot.startsAtUtc.toISOString(),
      fighter: b.fighter,
      service: b.service,
      user: b.user,
    }));
  }

  async get(bookingId: string): Promise<AdminBookingDetailDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        slot: { select: { startsAtUtc: true } },
        fighter: { select: { id: true, name: true } },
        service: { select: { id: true, title: true, priceCents: true, currency: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: booking.id,
      status: booking.status,
      startsAtUtc: booking.slot.startsAtUtc.toISOString(),
      fighter: booking.fighter,
      service: booking.service,
      user: booking.user,
    };
  }
}

