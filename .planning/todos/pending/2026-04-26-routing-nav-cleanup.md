---
created: 2026-04-25T21:45:00.000Z
title: Remove Home page, fix routing defaults
area: ui
files: []
---

## Problem

Current app has Home page duplicating auth/profile entrypoints (create account, sign in, profile). Also need safer routing behavior:

- `/explore` should be default landing route (and post-login destination).
- Unknown URL should redirect to default route (avoid broken state).
- Add explicit back arrow top-left on all pages (in addition to swipe back).

## Solution

TBD implementation details.

- Delete/disable Home page route + navigation entry.
- Set default route to `/explore`.
- Ensure login redirect uses `returnTo` when provided, else `/explore`.
- Add route wildcard redirect to `/explore`.
- Add shared header/back button pattern across pages.

