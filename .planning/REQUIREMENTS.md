# Requirements: Champ

**Defined:** 2026-04-24  
**Core Value:** A customer can complete one real booking (fighter → service → slot → pay → confirmed) without manual back-office intervention.

## v1 Requirements

### Authentication & profile

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User can log in and remain authenticated across browser refresh
- [ ] **AUTH-03**: User can log out
- [ ] **AUTH-04**: User can reset password via email link (or equivalent secure recovery flow)
- [ ] **AUTH-05**: User can view and edit basic profile fields used for bookings (name, contact)

### Fighters catalog

- [ ] **CAT-01**: User can browse a list of fighters with name, photo, and short summary
- [ ] **CAT-02**: User can open a fighter profile from the catalog
- [ ] **CAT-03**: Catalog data is loaded from the backend (not hardcoded only in the client)

### Fighter profile & services

- [ ] **FTR-01**: User can view fighter profile information (bio, disciplines, media as available)
- [ ] **FTR-02**: User can view all bookable services for that fighter with duration, modality (online/offline), and price
- [ ] **FTR-03**: User can select exactly one service before choosing a time

### Calendar & slots

- [ ] **CAL-01**: User can view a calendar or date picker scoped to the selected fighter and service
- [ ] **CAL-02**: User sees only time slots returned by the backend as available
- [ ] **CAL-03**: Shown times respect a defined timezone policy (documented behavior; UTC storage)

### Booking

- [ ] **BKG-01**: Authenticated user can create a booking for a chosen slot and service
- [ ] **BKG-02**: System prevents two confirmed bookings for the same fighter time slot (server-enforced)
- [ ] **BKG-03**: User sees booking status (e.g. awaiting payment, confirmed, cancelled)
- [ ] **BKG-04**: After successful payment, booking becomes confirmed and the slot is no longer offered

### Payment

- [ ] **PAY-01**: User can pay for an awaiting-payment booking through a supported provider (Stripe recommended)
- [ ] **PAY-02**: User is returned to the app with clear success or cancellation outcome after checkout
- [ ] **PAY-03**: Backend processes payment provider webhooks and updates booking payment state
- [ ] **PAY-04**: Webhook handling is idempotent (safe on duplicate delivery)

### My bookings

- [x] **MBB-01**: User can list their own upcoming and past bookings
- [x] **MBB-02**: User can open a booking detail view with fighter, service, time, and status

### Notifications

- [x] **NOT-01**: User receives confirmation when a booking becomes confirmed (email minimum)
- [x] **NOT-02**: User receives notification on material status change (e.g. cancellation) when applicable

### Admin

- [x] **ADM-01**: Authorized staff can access an admin area separated from customer routes
- [x] **ADM-02**: Staff can create, update, and deactivate fighters shown in the catalog
- [x] **ADM-03**: Staff can manage services attached to a fighter (types, duration, online/offline, price)
- [x] **ADM-04**: Staff can manage schedule or availability that drives public slots
- [x] **ADM-05**: Staff can view bookings for operational support (read-only acceptable for v1)

## v2 Requirements

### Auth & identity

- **AUTHV2-01**: OAuth sign-in (Google, Apple)
- **AUTHV2-02**: Two-factor authentication

### Catalog & discovery

- **CATV2-01**: Rich search filters (weight class, location, price range)
- **CATV2-02**: Fighter availability hints on catalog cards

### Payments & payouts

- **PAYV2-01**: Stripe Connect (or equivalent) for fighter payouts and onboarding

### Notifications

- **NOTV2-01**: Push notifications (mobile web or native)
- **NOTV2-02**: User-configurable notification preferences

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS/Android apps | Web-first; Ionic responsive UI covers v1 |
| In-app chat between fan and fighter | High moderation/compliance burden; defer |
| Public reviews & ratings | Needs moderation; not required for booking loop |
| Dynamic surge pricing | Operational complexity; human-set prices in admin for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| CAT-01 | Phase 2 | Pending |
| CAT-02 | Phase 2 | Pending |
| CAT-03 | Phase 2 | Pending |
| FTR-01 | Phase 2 | Pending |
| FTR-02 | Phase 2 | Pending |
| FTR-03 | Phase 2 | Pending |
| CAL-01 | Phase 3 | Pending |
| CAL-02 | Phase 3 | Pending |
| CAL-03 | Phase 3 | Pending |
| BKG-01 | Phase 3 | Pending |
| BKG-02 | Phase 3 | Pending |
| BKG-03 | Phase 3 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| PAY-04 | Phase 4 | Pending |
| BKG-04 | Phase 4 | Pending |
| MBB-01 | Phase 5 | Completed (05-02) |
| MBB-02 | Phase 5 | Completed (05-02) |
| NOT-01 | Phase 5 | Completed (05-03) |
| NOT-02 | Phase 5 | Completed (05-03) |
| ADM-01 | Phase 6 | Completed (06) |
| ADM-02 | Phase 6 | Completed (06) |
| ADM-03 | Phase 6 | Completed (06) |
| ADM-04 | Phase 6 | Completed (06) |
| ADM-05 | Phase 6 | Completed (06) |

**Coverage:**

- v1 requirements: 33 total  
- Mapped to phases: 33  
- Unmapped: 0 ✓  

---
*Requirements defined: 2026-04-24*  
*Last updated: 2026-04-24 after roadmap initialization*
