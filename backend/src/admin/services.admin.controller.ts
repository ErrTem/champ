import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { CreateAdminServiceDto, UpdateAdminServiceDto } from './dto/admin-service.dto';
import { ServicesAdminService } from './services.admin.service';

@UseGuards(JwtAccessAuthGuard, AdminGuard)
@Controller('admin')
export class ServicesAdminController {
  constructor(private readonly services: ServicesAdminService) {}

  @Get('fighters/:fighterId/services')
  async listForFighter(@Param('fighterId') fighterId: string) {
    return this.services.listForFighter(fighterId);
  }

  @Post('fighters/:fighterId/services')
  async createForFighter(@Param('fighterId') fighterId: string, @Body() dto: CreateAdminServiceDto) {
    return this.services.createForFighter(fighterId, dto);
  }

  @Patch('services/:serviceId')
  async update(@Param('serviceId') serviceId: string, @Body() dto: UpdateAdminServiceDto) {
    return this.services.update(serviceId, dto);
  }
}

