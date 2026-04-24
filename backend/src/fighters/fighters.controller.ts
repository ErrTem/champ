import { Controller, Get, Param } from '@nestjs/common';
import { FighterListItemDto } from './dto/fighter-list-item.dto';
import { FighterProfileDto } from './dto/fighter-profile.dto';
import { FightersService } from './fighters.service';

@Controller('fighters')
export class FightersController {
  constructor(private readonly fightersService: FightersService) {}

  @Get()
  async list(): Promise<FighterListItemDto[]> {
    return this.fightersService.listPublished();
  }

  @Get(':fighterId')
  async getProfile(@Param('fighterId') fighterId: string): Promise<FighterProfileDto> {
    return this.fightersService.getPublishedProfile(fighterId);
  }
}

