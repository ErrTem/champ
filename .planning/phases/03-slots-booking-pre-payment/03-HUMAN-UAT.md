---
status: partial
phase: 03-slots-booking-pre-payment
source: [03-VERIFICATION.md]
started: 2026-04-24T09:34:17.121Z
updated: 2026-04-24T09:34:17.121Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. E2E booking flow (logged-in)
expected: From fighter profile → service → /book, user can pick a day/time, reserve, and immediately sees status "Awaiting payment".
result: [pending]

### 2. E2E login return-to preservation
expected: When logged out, tapping "Reserve slot" redirects to `/login?returnTo=/book?...`; after login, user returns to booking flow with date/slot preserved when still valid.
result: [pending]

### 3. Concurrency guard under real load
expected: Parallel reservation attempts for same `slotId` yield exactly one success (201) and the rest 409 `SLOT_UNAVAILABLE`.
result: [pending]

### 4. Availability correctness and timezone presentation
expected: Times shown match America/Los_Angeles policy and the next-30-days horizon; unavailable/reserved slots are not presented as available.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

