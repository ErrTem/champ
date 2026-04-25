---
created: 2026-04-25T21:45:00.000Z
title: Add gyms domain + multi-timezone support
area: api
files: []
---

## Problem

Need gyms concept:

- For now only 1 gym exists, but future: multiple gyms across USA (Florida, Las Vegas, etc)
- Gym has address + "Show on map" button (open Google/Apple Maps)
- Timezone policy must support gyms in different US timezones (not only America/Los_Angeles)

## Solution

TBD.

- Add `Gym` entity with name, address, timezone, map links.
- Associate fighters to gym.
- Update slot generation + display formatting to use gym timezone (per fighter/gym).
- Update UI: show gym address + open external map app.

