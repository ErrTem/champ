## Phase 14 / Plan 02 Summary

- Added `ShareService` (uses share sheet when available, else copy-link fallback).
- Added `url-safety` util + unit tests; only allow absolute `https:` URLs for clickable social links.
- Fighter profile UI now shows Share button and conditional social links (Instagram/Facebook/X) only when safe URL present.

### Verification

- `npm test`

### Manual checkpoint (pending)

- Open fighter profile in browser.
- Click Share: share sheet opens (if supported) else “Link copied”.
- Confirm link equals `{origin}/explore/fighters/{fighterId}`.
- Seed unsafe `javascript:` social URL server-side; confirm no clickable link renders.

