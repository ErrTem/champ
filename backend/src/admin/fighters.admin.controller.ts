import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { FightersAdminService } from './fighters.admin.service';
import { CreateAdminFighterDto, UpdateAdminFighterDto } from './dto/admin-fighter.dto';

@Controller('admin/fighters')
@UseGuards(JwtAccessAuthGuard, AdminGuard)
export class FightersAdminController {
  constructor(private readonly fighters: FightersAdminService) {}

  @Get()
  async list() {
    return this.fighters.listAll();
  }

  @Post()
  async create(@Body() dto: CreateAdminFighterDto) {
    return this.fighters.create(dto);
  }

  @Patch(':fighterId')
  async update(@Param('fighterId') fighterId: string, @Body() dto: UpdateAdminFighterDto) {
    return this.fighters.update(fighterId, dto);
  }
}

