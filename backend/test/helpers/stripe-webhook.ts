import Stripe from 'stripe';

const stripe = new Stripe('sk_test_dummy', {
  // This is used only for local signing helpers in tests (no outbound network).
  apiVersion: '2024-06-20',
});

export function createStripeSignatureHeader(params: {
  webhookSecret: string;
  payload: string | Buffer;
  timestamp?: number;
}): string {
  const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000);
  return stripe.webhooks.generateTestHeaderString({
    payload: params.payload,
    secret: params.webhookSecret,
    timestamp,
  });
}

