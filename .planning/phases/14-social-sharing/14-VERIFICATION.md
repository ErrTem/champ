## Phase 14 Verification

### Automated

- Backend e2e: `cd backend && npm test` ✅
- Frontend unit: `npm test` ✅

### Manual

- Fighter profile has Share button; share sheet when supported, copy-link fallback otherwise ✅
- Shared/copied link uses canonical route `/explore/fighters/:fighterId` ✅
- Social links render only when present + safe (no clickable `javascript:`) ✅

