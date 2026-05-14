---
gsd_quick: true
date: 2026-05-14
slug: desktop-web-phone-column
---

# Quick task: desktop web shows phone-width layout

## Goal

Mobile-first Ionic app deployed as web looked stretched on laptop viewports. Constrain layout on wide screens to ~phone max width, centered, with gutter background matching app theme.

## Tasks

1. Add global SCSS: `app-root` flex center from 480px breakpoint; `ion-app` `max-width: 430px`, full height, subtle edge shadow.
2. Verify `npm run build` passes.

## Out of scope

Native iOS shell; modal/overlay positioning edge cases beyond standard Ionic.
