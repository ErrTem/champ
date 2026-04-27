## 11-02 Summary

Backend now gym-timezone correct (no hidden LA constant).

- **Availability**: removed `AVAILABILITY_TIMEZONE` constant; resolved timezone per request via fighter → gym; parsing `fromDate` and day bucketing uses gym timezone; response includes `timezone` explicitly.
- **Admin**: schedule regeneration uses fighter gym timezone for window boundaries; admin bookings date filters now require `fighterId` scope and parse date-only bounds in that gym timezone.
- **Tests**: added `availability.timezone.e2e-spec.ts` covering gym-local bucketing using same UTC instant; updated admin bookings e2e to match new filter semantics.

### Verification

- `cd backend; npm test`

