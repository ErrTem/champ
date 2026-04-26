---
status: partial
phase: 08-routing-app-shell-navigation
source: [08-VERIFICATION.md]
started: 2026-04-26T10:45:00Z
updated: 2026-04-26T10:45:00Z
---

## Current Test

awaiting human testing for deep link + tab/back behavior

## Tests

### 1. Cold deep link then header back
expected: Open app at `/explore/fighters/:id` with no history; header back navigates to `/explore` (not Home) and Explore tab stays selected.
result: [pending]

### 2. Tab re-press returns to tab root
expected: While on `/explore/fighters/:id`, tapping Explore tab navigates to `/explore` (pop-to-root feel). Repeat for Bookings/Profile/Admin.
result: [pending]

### 3. Cross-tab back stays sane
expected: Navigate Explore → details, switch to Profile, hit back: stays within Profile stack or falls back to `/explore` deterministically (no cross-tab chain confusion).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

