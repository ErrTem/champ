# Research — Features (Champ)

## Table stakes (users expect)

| Area | Capabilities |
|------|----------------|
| Auth | Sign up, login, logout, password reset, session persistence |
| Catalog | Search/list fighters; photo + short bio; link to profile |
| Profile | Bio, disciplines, services with **clear price and duration** |
| Booking | Slot picker respects timezone; conflict-free commit |
| Payment | Clear total, failed payment handling, receipt/confirmation |
| My bookings | List upcoming/past; status visible (pending/paid/cancelled) |
| Notifications | At minimum email on confirm; optional push later |

## Differentiators (optional v1 / v2)

- Fighter-specific **policies** (cancellation window, location for offline).
- **Waitlist** when slots sell out.
- **Packages** (multi-session) — likely v2.

## Anti-features (deliberately not v1)

- Social feed, follower graph, DMs.
- Dynamic surge pricing without human review.
- Public reviews before moderation workflow exists.

## Complexity notes

- **Calendar / slots** is the highest subtlety: DST, timezone display vs storage, concurrent holds.
- **Payments + webhooks** second: idempotency and replay safety.

## Dependencies

- Auth before “My bookings.”
- Fighter + service + slot APIs before booking UI.
- Booking **intent/hold** before payment (or payment-first with careful orphan handling — pick one pattern in architecture).
