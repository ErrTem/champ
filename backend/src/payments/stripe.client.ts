import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeClient {
  readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }
}

