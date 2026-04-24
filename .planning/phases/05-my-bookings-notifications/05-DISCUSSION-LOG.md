# Phase 5: My bookings & notifications - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `05-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24  
**Phase:** 5 — My bookings & notifications  
**Areas discussed:** My bookings list UX, Booking detail UX, Notifications delivery, Notification events

---

## My bookings list UX

| Option | Description | Selected |
|--------|-------------|----------|
| 2 tabs | Upcoming / Past | ✓ |
| Sections | One page with Upcoming then Past sections | |
| Mixed list | Single chronological list | |

**Row content**

| Option | Description | Selected |
|--------|-------------|----------|
| Compact | Fighter + service + local date/time + status chip | ✓ |
| Rich | Add price + location/online label | |
| Minimal | Only fighter + date/time | |

**Sorting**

| Option | Description | Selected |
|--------|-------------|----------|
| Split sort | Upcoming soonest-first; Past newest-first | ✓ |
| Always newest | Newest-first everywhere | |
| Always oldest | Oldest-first everywhere | |

**Empty state**

| Option | Description | Selected |
|--------|-------------|----------|
| CTA Explore | Friendly empty + CTA to Explore fighters | ✓ |
| CTA Home | Empty + CTA to Home | |
| Quiet | No CTA | |

---

## Booking detail UX

**Content density**

| Option | Description | Selected |
|--------|-------------|----------|
| Full | fighter/service/local time/status/payment state/price | ✓ |
| Simple | fighter/service/time/status only | |
| Minimal | mostly confirmation text | |

**Time formatting**

| Option | Description | Selected |
|--------|-------------|----------|
| PT no label | local time only, no “PT” label | ✓ |
| PT label | time + “PT” | |
| Both | PT + user local time | |

**Awaiting payment actions**

| Option | Description | Selected |
|--------|-------------|----------|
| Pay now | primary CTA | ✓ |
| Pay + cancel | add cancel booking | |
| None | informational only | |

**Past/terminal actions**

| Option | Description | Selected |
|--------|-------------|----------|
| None | no actions | ✓ |
| Receipt | link to Stripe receipt | |
| Rebook | “Book again” shortcut | |

---

## Notifications delivery

**Provider approach**

| Option | Description | Selected |
|--------|-------------|----------|
| Dev log | log payload/link; document swap path | ✓ |
| Resend | real emails via Resend API | |
| SendGrid/SES/SMTP | real emails via heavier config | |

**Sender**

| Option | Description | Selected |
|--------|-------------|----------|
| noreply@… | noreply address | ✓ |
| support@… | support address | |
| champ@… | brand address | |

**Links**

| Option | Description | Selected |
|--------|-------------|----------|
| Deep link | link to booking detail in app | ✓ |
| List | link to My bookings list | |
| None | no links | |

**Tone**

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | minimal transactional | ✓ |
| Friendly | light brand voice | |
| Detailed | receipt-like details | |

---

## Notification events

**Confirmed booking**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes | send on confirmed | ✓ |
| No | don’t send | |

**“Cancellation when applicable” meaning**

| Option | Description | Selected |
|--------|-------------|----------|
| Expiry only | notify on hold expiry | ✓ |
| Explicit cancel only | only if a cancel feature exists | |
| Both | expiry + explicit cancel later | |

**Awaiting-payment creation email**

| Option | Description | Selected |
|--------|-------------|----------|
| No | don’t email on creation | ✓ |
| Yes | email “reserved, complete payment” | |

**Payment cancel email**

| Option | Description | Selected |
|--------|-------------|----------|
| No | don’t email on Stripe cancel return | ✓ |
| Yes | email “payment not completed” | |

---

## Claude's Discretion

- (none)

## Deferred Ideas

- True booking cancellation feature (new capability) — future phase if needed.
- Real email provider integration — future phase swap point.

