---
created: 2026-04-25T21:45:00.000Z
title: Upgrade registration (OAuth, phone mask, terms, roles)
area: auth
files: []
---

## Problem

Registration needs new capabilities:

- OAuth registration/login via Google and Apple
- Phone field with USA prefix + input mask
- Required checkbox: "I am older 18 y.o."
- Required checkbox: "I have read and agree with terms and services" + mock Terms page/content
- During registration user chooses profile type: fighter vs regular user
  - Fighter accounts should be pending until admin approval

## Solution

TBD.

- Add OAuth providers + backend identity linking.
- Extend user profile schema for phone + flags + role + approval state.
- Add terms route + link from registration.
- Add admin workflow to approve fighter accounts (also impacts auth guard/visibility).

