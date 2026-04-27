---
phase: 12-fighter-self-serve
created: 2026-04-26
status: complete
---

# Phase 12: Fighter self-serve — Validation

## Goal
Fighter can self-manage schedule + services + cancel bookings, with strict server-side ownership checks and approval gating.

## Requirements
- R8 (from `.planning/REQUIREMENTS.md`)

## Must-have truths (plan must enforce)
1. Only `userType=fighter` + `fighterStatus=approved` users can access self-serve.
2. Backend resolves “current fighterId” server-side; client never supplies fighterId for self-serve actions.
3. Fighter can view + replace own schedule rules; slot regeneration occurs (same behavior as admin schedule replace).
4. Fighter can list/create/update own services.
5. Fighter can cancel future bookings tied to own fighter; booking transitions to a cancelled state; user is notified.
6. Cancellation frees up slot consistently (no orphan reservations/confirmations).

## Non-goals
- Full refund automation if not already trivial; must document policy.
- UX redesign beyond adding required screens/entrypoints.

