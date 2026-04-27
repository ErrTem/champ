import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { UpsertPushSubscriptionDto } from './dto/push-subscription.dto';
import { PushService } from './push.service';

type JwtUser = { sub: string; email: string };

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('subscriptions')
  @UseGuards(JwtAccessAuthGuard)
  async list(@Req() req: { user: JwtUser }) {
    return await this.push.listSubscriptions(req.user.sub);
  }

  @Post('subscriptions')
  @UseGuards(JwtAccessAuthGuard)
  async upsert(@Req() req: { user: JwtUser }, @Body() dto: UpsertPushSubscriptionDto) {
    return await this.push.upsertSubscription(req.user.sub, dto);
  }

  @Delete('subscriptions/:id')
  @UseGuards(JwtAccessAuthGuard)
  async delete(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    await this.push.deleteSubscription(req.user.sub, id);
    return { ok: true };
  }
}

