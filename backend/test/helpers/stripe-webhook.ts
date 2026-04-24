import Stripe from 'stripe';

const stripe = new Stripe('sk_test_dummy', {
  // This is used only for local signing helpers in tests (no outbound network).
  apiVersion: '2025-08-27.basil',
});

export function createStripeSignatureHeader(params: {
  webhookSecret: string;
  payload: string;
  timestamp?: number;
}): string {
  const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000);
  return stripe.webhooks.generateTestHeaderString({
    payload: params.payload,
    secret: params.webhookSecret,
    timestamp,
  });
}

