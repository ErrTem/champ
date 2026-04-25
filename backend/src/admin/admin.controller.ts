import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';

@Controller('admin')
@UseGuards(JwtAccessAuthGuard, AdminGuard)
export class AdminController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}

