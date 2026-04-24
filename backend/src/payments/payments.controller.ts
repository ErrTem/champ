import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { PaymentsService } from './payments.service';

type JwtUser = { sub: string; email: string };

@Controller('bookings')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':bookingId/checkout-session')
  @UseGuards(JwtAccessAuthGuard)
  async createCheckoutSession(@Req() req: { user: JwtUser }, @Param('bookingId') bookingId: string) {
    const result = await this.payments.createOrReuseCheckoutSession({
      bookingId,
      userId: req.user.sub,
    });
    return { checkoutUrl: result.checkoutUrl };
  }

  @Post(':bookingId/confirm-payment')
  @UseGuards(JwtAccessAuthGuard)
  async confirmPayment(
    @Req() req: { user: JwtUser },
    @Param('bookingId') bookingId: string,
    @Body() body: { sessionId?: string },
  ) {
    const sessionId = body?.sessionId;
    if (!sessionId) return { ok: true as const };
    return await this.payments.confirmBookingFromReturn({
      bookingId,
      userId: req.user.sub,
      stripeSessionId: sessionId,
    });
  }
}

