import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
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
    if (!this.stripeClient.stripe) {
      throw new ServiceUnavailableException(
        'Stripe is not configured (set STRIPE_SECRET_KEY to accept webhooks).',
      );
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException(
        'Stripe webhooks are not configured (set STRIPE_WEBHOOK_SECRET).',
      );
    }
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

