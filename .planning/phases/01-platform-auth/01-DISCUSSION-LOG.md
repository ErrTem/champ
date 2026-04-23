# Phase 1: Platform & auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 1 — Platform & auth
**Areas discussed:** Persistent login (AUTH-02), Backend stack, Password-reset email, Profile fields, iOS bundle constraint

---

## Persistent login (AUTH-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Short-lived access + refresh in httpOnly cookie | SPA survives refresh; avoids long-lived secrets in localStorage | ✓ |
| Alternative session strategies | Full server session cookie only, or risky localStorage JWT | |

**User's choice:** Agreed with recommended approach (access + refresh, httpOnly cookie model).
**Notes:** Aligns with AUTH-02 and common SPA security practice.

---

## Backend stack

| Option | Description | Selected |
|--------|-------------|----------|
| NestJS | Structured modules, familiar to Angular teams | ✓ |
| Fastify / Express minimal | Smaller surface, less convention | |

**User's choice:** NestJS

---

## Password-reset email (AUTH-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Dev logging + documented production swap | Unblocks local/staging without provider setup | ✓ |
| Real transactional email in Phase 1 | Immediate provider integration | |

**User's choice:** Dev logging

---

## Auth & profile UX (AUTH-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Name + email + phone required | Clear minimum for booking-related profile | ✓ |

**User's choice:** name, email, phone

---

## Additional constraint (milestone 1)

**User input:** App will be bundled for **iOS** for milestone 1.

**Captured in CONTEXT:** Auth/session must be verified on packaged iOS (WKWebView / Capacitor), including cookies, `SameSite`/`Secure`, and cross-origin API concerns.

---

## Claude's Discretion

- Token TTLs, cookie naming, NestJS internal layout, Ionic visual details (see CONTEXT.md).

## Deferred Ideas

- None raised in this short confirmation pass beyond existing v2 items in REQUIREMENTS.
