import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { ReplaceScheduleRulesDto } from './dto/admin-schedule.dto';
import { ScheduleAdminService } from './schedule.admin.service';

@UseGuards(JwtAccessAuthGuard, AdminGuard)
@Controller('admin')
export class ScheduleAdminController {
  constructor(private readonly schedule: ScheduleAdminService) {}

  @Get('fighters/:fighterId/schedule-rules')
  async list(@Param('fighterId') fighterId: string) {
    return this.schedule.listRules(fighterId);
  }

  @Put('fighters/:fighterId/schedule-rules')
  async replace(@Param('fighterId') fighterId: string, @Body() body: ReplaceScheduleRulesDto) {
    return this.schedule.replaceRulesAndRegenerate({ fighterId, rules: body.rules ?? [] });
  }
}

