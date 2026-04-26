---
phase: 08-footer-admin-nav-restructure
plan: 01
status: complete
wave: 1
---

## Summary
- Removed all `<ion-header>` usage across app templates.
- Removed all `<app-header>` usage across app templates; `HeaderComponent` template now renders nothing.

## Key changes
- `src/app/shell/header.component.html`: removed Ionic header/back UI.
- Multiple page templates updated to rely on in-content hero/title instead of Ionic headers.

## Self-check
- `rg "<ion-header" src/app` → 0 matches
- `rg "<app-header" src/app` → 0 matches
- `npm run lint` → pass
- `npm run build` → pass

