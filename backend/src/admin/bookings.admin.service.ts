import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminBookingDetailDto,
  AdminBookingListItemDto,
  AdminBookingsQueryDto,
} from './dto/admin-bookings.dto';

function parseDateBounds(args: { from?: string; to?: string; timezone: string }): {
  fromUtc?: Date;
  toUtcExclusive?: Date;
} {
  const { from, to, timezone } = args;
  const out: { fromUtc?: Date; toUtcExclusive?: Date } = {};

  if (from) {
    const startLocal = DateTime.fromISO(from, { zone: timezone }).startOf('day');
    if (!startLocal.isValid) throw new BadRequestException('Invalid from');
    out.fromUtc = startLocal.toUTC().toJSDate();
  }

  if (to) {
    const endLocalExclusive = DateTime.fromISO(to, { zone: timezone })
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
    if ((query.from || query.to) && !query.fighterId) {
      throw new BadRequestException('from/to require fighterId (timezone scope)');
    }

    const timezone = query.fighterId ? await this.resolveFighterGymTimezone(query.fighterId) : 'utc';
    const { fromUtc, toUtcExclusive } = parseDateBounds({ from: query.from, to: query.to, timezone });

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

  private async resolveFighterGymTimezone(fighterId: string): Promise<string> {
    const fighter = await this.prisma.fighter.findUnique({
      where: { id: fighterId },
      select: { gym: { select: { timezone: true } } },
    });
    const tz = fighter?.gym?.timezone?.trim();
    if (!tz) throw new BadRequestException('Invalid fighterId (missing gym/timezone)');
    return tz;
  }
}

