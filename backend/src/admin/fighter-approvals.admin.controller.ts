import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { FighterApprovalsAdminService } from './fighter-approvals.admin.service';

@Controller('admin/fighter-approvals')
@UseGuards(JwtAccessAuthGuard, AdminGuard)
export class FighterApprovalsAdminController {
  constructor(private readonly approvals: FighterApprovalsAdminService) {}

  @Get()
  async list(@Query('status') status: 'pending' = 'pending') {
    return this.approvals.list(status);
  }

  @Post(':userId/approve')
  async approve(@Param('userId') userId: string) {
    return this.approvals.approve(userId);
  }
}

