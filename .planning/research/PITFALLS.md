# Research — Pitfalls (Champ)

| Pitfall | Warning signs | Prevention | Phase hint |
|---------|---------------|------------|------------|
| Double booking | Two users “confirm” same slot; DB unique constraint errors in prod | DB uniqueness on `(fighter_id, start_at)` for confirmed bookings; short-lived holds table; transactional booking commit | Booking / slots |
| Timezone bugs | Off-by-one hour after DST; wrong “local” display | Store UTC; store `IANA` tz per fighter or venue; test DST edges | Calendar |
| Webhook replay / spoof | Random state changes; duplicate events | Verify Stripe signature; **idempotent** webhook handler keyed by `event.id` | Payments |
| Payment succeeded, booking failed | Money taken, no slot | Use metadata + reconciliation job; never mark paid without booking row | Payments |
| PII in logs | Emails/cards in application logs | Structured logging with redaction; never log full payloads | All |
| Admin bypass | Public API accepts admin-only fields | Role checks on server; separate DTOs | Admin |
| Scope creep on notifications | Building full preference center early | Email + in-app toast for v1; defer matrix prefs | Notifications |
