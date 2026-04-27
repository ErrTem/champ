## Phase 14 / Plan 01 Summary

- Added optional social URL fields on `Fighter`: `instagramUrl`, `facebookUrl`, `xUrl`.
- Public `GET /fighters/:fighterId` now returns those fields as `string | null` for published fighters.
- Admin create/update supports setting/clearing social URLs; backend rejects non-`https:` schemes (incl `javascript:`).

### Verification

- `cd backend && npm run prisma:generate`
- `cd backend && npm test`

