---
created: 2026-04-25T21:45:00.000Z
title: Booking UX + rules fixes (filters, calendar UI, 24h rule)
area: ui
files: []
---

## Problem

Need multiple UX/rules fixes:

- `/explore` filters: working price range + training type filters (boxing, freestyle, online, etc)
- `/book` calendar UI: month select on top, arrows to switch month, month schedule below
- Booking rule: cannot book earlier than 24 hours before session start

## Solution

TBD.

- Fix explore filters to flow from UI → query params → API and back.
- Rework booking calendar component to match requested layout.
- Add server-side enforcement for 24h rule (and reflect errors in UI).

