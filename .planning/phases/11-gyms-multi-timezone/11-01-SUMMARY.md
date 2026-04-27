## 11-01 Summary

Implemented gyms foundation + default backfill.

- **DB/Prisma**: added `Gym` model (address + IANA `timezone`), added required `Fighter.gymId` with default `gym_default_01`, added migration to create + seed default gym and enforce FK.
- **Backend**: added `GymsModule` + `GymsService` with IANA timezone validation + default gym lookup.
- **DTO/API**: extended `FighterProfileDto` to include `gym` object (id, name, timezone, address fields); updated `FightersService` profile query to `select` gym and map to DTO.
- **Seed**: ensured default gym exists and seeded fighters assigned to it.
- **Tests**: added e2e specs for timezone validation and default gym/fighter backfill invariant; updated test DB reset helper to truncate `Gym` and recreate default gym.

### Verification

- `cd backend; npx prisma migrate dev`
- `cd backend; npm test -- gyms.service gyms.migration-backfill`

