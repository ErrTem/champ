## 11-03 Summary

Frontend now shows gym address on fighter profile + opens maps safely.

- **Shared util**: added `src/app/shared/utils/map-links.ts` with pure helpers to format address and build canonical Google/Apple Maps URLs via proper URL encoding; added unit spec `map-links.spec.ts`.
- **Fighter profile UI**: added Gym section with address + “Show on map” button; iOS uses Apple Maps URL, others use Google Maps search.
- **Models**: updated `FighterProfile` model to include `gym`; updated mock catalog data accordingly.
- **Booking time display**: booking flow (`BookPlaceholderPage`) now formats dates/times using API-provided timezone (`availability.timezone` or `fighter.gym.timezone`) instead of hardcoded LA.

### Verification

- `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/shared/utils/map-links.spec.ts`

