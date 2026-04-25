---
created: 2026-04-25T21:45:00.000Z
title: Add bottom footer navigation (Explore/Bookings/Profile/Admin)
area: ui
files: []
---

## Problem

Need persistent footer nav with icons:

- Explore
- Bookings
- Profile
- Admin (only visible for admin users)

Today navigation is more ad-hoc; want consistent wayfinding.

## Solution

TBD.

- Implement Ionic tab bar (or equivalent) at app shell level.
- Gate Admin tab by `isAdmin` (from `/users/me`).
- Ensure deep links preserve selected tab + correct back behavior.

