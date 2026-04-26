# Phase 14: Social sharing — Research

**Researched:** 2026-04-26  
**Domain:** Ionic/Angular sharing UX + link validation  
**Confidence:** MEDIUM (codebase patterns known; exact share API choice depends on existing deps)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R10 | Social links render when present | Straightforward optional fields + conditional UI render; validate URLs before binding to `href`. |
| R10 | Share action works on web/PWA (copy minimum) | Web clipboard API works broadly with fallback. |
| R10 | Share sheet where available | Use `navigator.share` when present; if app later uses Capacitor plugin, keep adapter behind capability checks. |

</phase_requirements>

## Recommended approach (frontend)

- Prefer a single `ShareService` with capability detection:
  - `navigator.share` if present (secure context) and supports required payload
  - else copy to clipboard (with `navigator.clipboard.writeText` if available; else fallback to hidden textarea copy)
- Centralize URL building for fighter profile canonical link.
- Validate social links before rendering:
  - allow only `https:` URLs (and maybe `http:` in dev), reject `javascript:` etc
  - normalize handles (e.g. `@user` -> `https://instagram.com/user`) if you choose “handle” fields instead of URL fields (decision in plan)

## Notes

- Codebase already targets Capacitor/iOS; avoid breaking WKWebView. Keep feature functional on web even if native share unavailable.

## Metadata

**Valid until:** 2026-05-26
