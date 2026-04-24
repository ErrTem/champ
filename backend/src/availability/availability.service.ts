import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { AVAILABILITY_TIMEZONE, MAX_DAYS, SLOT_STEP_MINUTES } from './availability.constants';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilityDayDto, AvailabilityRangeDto, AvailabilityResponseDto } from './dto/availability-response.dto';
import { SlotDto } from './dto/slot.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    const days = Math.min(Math.max(query.days ?? MAX_DAYS, 1), MAX_DAYS);
    const startLocal = this.resolveStartLocalDate(query.fromDate);
    const fromDate = startLocal.toISODate();
    if (!fromDate) {
      throw new BadRequestException('Invalid fromDate');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: query.serviceId, fighterId: query.fighterId },
      select: { id: true, durationMinutes: true, fighterId: true },
    });
    if (!service) {
      throw new NotFoundException('Fighter/service not found');
    }

    const rules = await this.prisma.fighterScheduleRule.findMany({
      where: { fighterId: service.fighterId, active: true },
      select: { dayOfWeek: true, startMinute: true, endMinute: true },
    });

    const candidates = this.generateCandidateSlots({
      fighterId: service.fighterId,
      serviceId: service.id,
      startLocal,
      days,
      durationMinutes: service.durationMinutes,
      rules,
    });

    if (candidates.length > 0) {
      await this.prisma.slot.createMany({ data: candidates, skipDuplicates: true });
    }

    const startUtc = startLocal.toUTC().toJSDate();
    const endUtcExclusive = startLocal.plus({ days }).toUTC().toJSDate();
    const nowUtc = DateTime.utc().toJSDate();

    const availableSlots = await this.prisma.slot.findMany({
      where: {
        fighterId: service.fighterId,
        serviceId: service.id,
        startsAtUtc: { gte: startUtc, lt: endUtcExclusive },
        confirmedBookingId: null,
        OR: [{ reservedUntilUtc: null }, { reservedUntilUtc: { lt: nowUtc } }],
      },
      orderBy: { startsAtUtc: 'asc' },
      select: { id: true, startsAtUtc: true, endsAtUtc: true },
    });

    const dayMap = new Map<string, SlotDto[]>();
    for (const s of availableSlots) {
      const date = DateTime.fromJSDate(s.startsAtUtc, { zone: 'utc' }).setZone(AVAILABILITY_TIMEZONE).toISODate();
      if (!date) continue;
      const arr = dayMap.get(date) ?? [];
      arr.push({
        slotId: s.id,
        startsAtUtc: s.startsAtUtc.toISOString(),
        endsAtUtc: s.endsAtUtc.toISOString(),
        status: 'available',
      });
      dayMap.set(date, arr);
    }

    const responseDays: AvailabilityDayDto[] = [];
    for (let i = 0; i < days; i++) {
      const date = startLocal.plus({ days: i }).toISODate();
      if (!date) continue;
      responseDays.push({
        date,
        slots: dayMap.get(date) ?? [],
      });
    }

    const range: AvailabilityRangeDto = { fromDate, days };

    return {
      timezone: AVAILABILITY_TIMEZONE,
      range,
      days: responseDays,
    };
  }

  private resolveStartLocalDate(fromDate?: string): DateTime {
    if (!fromDate) {
      return DateTime.now().setZone(AVAILABILITY_TIMEZONE).startOf('day');
    }

    const parsed = DateTime.fromISO(fromDate, { zone: AVAILABILITY_TIMEZONE });
    if (!parsed.isValid) {
      throw new BadRequestException('Invalid fromDate');
    }
    return parsed.startOf('day');
  }

  private generateCandidateSlots(args: {
    fighterId: string;
    serviceId: string;
    startLocal: DateTime;
    days: number;
    durationMinutes: number;
    rules: Array<{ dayOfWeek: number; startMinute: number; endMinute: number }>;
  }): Array<{ fighterId: string; serviceId: string; startsAtUtc: Date; endsAtUtc: Date }> {
    const { fighterId, serviceId, startLocal, days, durationMinutes, rules } = args;
    const result: Array<{ fighterId: string; serviceId: string; startsAtUtc: Date; endsAtUtc: Date }> = [];

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const dayLocal = startLocal.plus({ days: dayOffset }).startOf('day');
      const dayOfWeek = dayLocal.weekday % 7; // Luxon: 1..7 (Mon..Sun) → 0..6 (Sun..Sat)

      const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
      for (const r of dayRules) {
        if (r.endMinute <= r.startMinute) continue;

        const windowStart = dayLocal.plus({ minutes: r.startMinute });
        const windowEnd = dayLocal.plus({ minutes: r.endMinute });

        let cursor = windowStart;
        // Candidate start times at 30-minute increments; end must fit in the window.
        while (cursor.plus({ minutes: durationMinutes }) <= windowEnd) {
          const endsLocal = cursor.plus({ minutes: durationMinutes });
          result.push({
            fighterId,
            serviceId,
            startsAtUtc: cursor.toUTC().toJSDate(),
            endsAtUtc: endsLocal.toUTC().toJSDate(),
          });
          cursor = cursor.plus({ minutes: SLOT_STEP_MINUTES });
        }
      }
    }

    return result;
  }
}

