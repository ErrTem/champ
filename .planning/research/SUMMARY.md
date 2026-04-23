# Research — Summary (Champ)

**Synthesized:** 2026-04-24

## Stack direction

- Keep **Angular + Ionic** for the client.
- Add a **PostgreSQL-backed API** (NestJS or Fastify) with an ORM (Prisma/Drizzle).
- Use **Stripe** with webhooks as the payment source of truth.

## Table stakes recap

Auth, fighter catalog + profile with priced services, real availability, booking with conflict safety, payment + confirmation, my bookings, basic notifications.

## Architecture headline

Server-authoritative slots and bookings; client is a thin orchestrator; Stripe webhooks finalize state.

## Top risks

1. Slot concurrency and timezones.  
2. Webhook idempotency and payment/booking consistency.  
3. Least-privilege admin vs public APIs.

## Deferred complexity

Native apps, Connect payouts, chat, advanced search — until core booking loop is proven.
