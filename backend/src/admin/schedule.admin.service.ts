import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AVAILABILITY_TIMEZONE, SLOT_STEP_MINUTES } from '../availability/availability.constants';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminScheduleRuleDto } from './dto/admin-schedule.dto';

function validateNoOverlaps(rules: AdminScheduleRuleDto[]): void {
  const byDay = new Map<number, Array<{ startMinute: number; endMinute: number }>>();
  for (const r of rules) {
    if (r.endMinute <= r.startMinute) {
      throw new BadRequestException('Invalid schedule rule window');
    }
    const arr = byDay.get(r.dayOfWeek) ?? [];
    arr.push({ startMinute: r.startMinute, endMinute: r.endMinute });
    byDay.set(r.dayOfWeek, arr);
  }

  for (const [day, windows] of byDay.entries()) {
    const sorted = windows.slice().sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (cur.startMinute < prev.endMinute) {
        throw new BadRequestException(`Overlapping rules for dayOfWeek=${day}`);
      }
    }
  }
}

@Injectable()
export class ScheduleAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listRules(fighterId: string): Promise<AdminScheduleRuleDto[]> {
    const rules = await this.prisma.fighterScheduleRule.findMany({
      where: { fighterId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      select: { dayOfWeek: true, startMinute: true, endMinute: true, active: true },
    });
    return rules;
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
      const dayOfWeek = dayLocal.weekday % 7; // Luxon Mon..Sun (1..7) → Sun..Sat (0..6)
      const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);

      for (const r of dayRules) {
        if (r.endMinute <= r.startMinute) continue;
        const windowStart = dayLocal.plus({ minutes: r.startMinute });
        const windowEnd = dayLocal.plus({ minutes: r.endMinute });
        let cursor = windowStart;

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

  async replaceRulesAndRegenerate(args: {
    fighterId: string;
    rules: AdminScheduleRuleDto[];
  }): Promise<{ ok: true }> {
    const { fighterId } = args;
    const inputRules = args.rules ?? [];
    const activeRules = inputRules.filter((r) => r.active);
    validateNoOverlaps(activeRules);

    await this.prisma.$transaction(async (tx) => {
      await tx.fighterScheduleRule.deleteMany({ where: { fighterId } });
      if (inputRules.length > 0) {
        await tx.fighterScheduleRule.createMany({
          data: inputRules.map((r) => ({
            fighterId,
            dayOfWeek: r.dayOfWeek,
            startMinute: r.startMinute,
            endMinute: r.endMinute,
            active: r.active,
          })),
        });
      }
    });

    const startLocal = DateTime.now().setZone(AVAILABILITY_TIMEZONE).startOf('day');
    const days = 30;
    const startUtc = startLocal.toUTC().toJSDate();
    const endUtcExclusive = startLocal.plus({ days }).toUTC().toJSDate();
    const nowUtc = DateTime.utc().toJSDate();

    const services = await this.prisma.service.findMany({
      where: { fighterId },
      select: { id: true, durationMinutes: true },
      orderBy: [{ id: 'asc' }],
    });

    const candidates: Array<{ fighterId: string; serviceId: string; startsAtUtc: Date; endsAtUtc: Date }> = [];
    for (const s of services) {
      candidates.push(
        ...this.generateCandidateSlots({
          fighterId,
          serviceId: s.id,
          startLocal,
          days,
          durationMinutes: s.durationMinutes,
          rules: activeRules.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            startMinute: r.startMinute,
            endMinute: r.endMinute,
          })),
        }),
      );
    }

    if (candidates.length > 0) {
      await this.prisma.slot.createMany({ data: candidates, skipDuplicates: true });
    }

    const candidateKey = new Set<string>();
    for (const c of candidates) {
      candidateKey.add(`${c.serviceId}:${c.startsAtUtc.getTime()}`);
    }

    const safeExisting = await this.prisma.slot.findMany({
      where: {
        fighterId,
        startsAtUtc: { gte: startUtc, lt: endUtcExclusive },
        confirmedBookingId: null,
        OR: [{ reservedUntilUtc: null }, { reservedUntilUtc: { lt: nowUtc } }],
      },
      select: { id: true, serviceId: true, startsAtUtc: true },
      orderBy: [{ startsAtUtc: 'asc' }, { id: 'asc' }],
    });

    const deletions: string[] = [];
    for (const s of safeExisting) {
      const key = `${s.serviceId}:${s.startsAtUtc.getTime()}`;
      if (!candidateKey.has(key)) deletions.push(s.id);
    }

    if (deletions.length > 0) {
      await this.prisma.slot.deleteMany({ where: { id: { in: deletions } } });
    }

    return { ok: true };
  }
}

