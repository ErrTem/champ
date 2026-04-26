# Phase 08 Context: Footer + admin nav restructure

## User change request (locked)

- No need in header and arrow back for all pages.
- When creating footer for admin page: move current admin footer items **Fighters / Services / Schedule / Bookings** to the **top**.

## Clarified intent

- Remove global/top header UI from all pages (customer + admin).
- Remove back-arrow UI from all pages (navigation must work via routing, tab/footer, and in-page actions).
- Admin area gets top navigation for: Fighters, Services, Schedule, Bookings.
- Admin footer (if created) must not contain those nav items anymore; footer can be used for secondary actions/status later.

## Success criteria

1. No header component rendered on any page.
2. No back-arrow UI rendered on any page.
3. Admin pages show top nav for Fighters/Services/Schedule/Bookings.
4. Existing admin footer nav items moved to top; no duplicated nav in footer.

## Scope notes

- Focus UI/layout + routing wiring only. No backend changes required.
