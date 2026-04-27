import { Controller, Get, Param, Query } from '@nestjs/common';
import { FighterListItemDto } from './dto/fighter-list-item.dto';
import { FighterProfileDto } from './dto/fighter-profile.dto';
import { FightersService } from './fighters.service';

type FightersListQuery = {
  minPriceCents?: string;
  maxPriceCents?: string;
  discipline?: string | string[];
  modality?: string | string[];
};

@Controller('fighters')
export class FightersController {
  constructor(private readonly fightersService: FightersService) {}

  @Get()
  async list(@Query() q: FightersListQuery): Promise<FighterListItemDto[]> {
    const asIntOrNull = (v: unknown): number | null => {
      if (typeof v !== 'string') return null;
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    };
    const asStringArr = (v: unknown): string[] => {
      if (typeof v === 'string') return [v];
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[];
      return [];
    };

    const minPriceCents = asIntOrNull(q.minPriceCents);
    const maxPriceCents = asIntOrNull(q.maxPriceCents);
    const disciplines = asStringArr(q.discipline).filter(Boolean);
    const modalities = asStringArr(q.modality)
      .filter((m) => m === 'online' || m === 'in_person')
      .filter(Boolean) as Array<'online' | 'in_person'>;

    return this.fightersService.listPublishedFiltered({
      minPriceCents,
      maxPriceCents,
      disciplines,
      modalities,
    });
  }

  @Get(':fighterId')
  async getProfile(@Param('fighterId') fighterId: string): Promise<FighterProfileDto> {
    return this.fightersService.getPublishedProfile(fighterId);
  }
}

