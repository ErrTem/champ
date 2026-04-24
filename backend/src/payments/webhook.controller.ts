import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { StripeClient } from './stripe.client';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('stripe')
export class WebhookController {
  constructor(
    private readonly stripeClient: StripeClient,
    private readonly payments: PaymentsService,
  ) {}

  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signatureHeader?: string,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is required');
    if (!signatureHeader) throw new BadRequestException('Missing Stripe-Signature header');

    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Missing raw body');

    let event;
    try {
      event = this.stripeClient.stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    await this.payments.processStripeEvent(event);
    return { received: true };
  }
}

