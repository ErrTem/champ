import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { NotificationPreferencesService } from './notification-preferences.service';

type JwtUser = { sub: string; email: string };

@Controller('notifications/preferences')
export class NotificationPreferencesController {
  constructor(private readonly prefs: NotificationPreferencesService) {}

  @Get()
  @UseGuards(JwtAccessAuthGuard)
  async get(@Req() req: { user: JwtUser }) {
    return await this.prefs.getOrCreate(req.user.sub);
  }

  @Put()
  @UseGuards(JwtAccessAuthGuard)
  async put(@Req() req: { user: JwtUser }, @Body() dto: UpdateNotificationPreferencesDto) {
    return await this.prefs.update(req.user.sub, dto);
  }
}

