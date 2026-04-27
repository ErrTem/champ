# Champ

Ionic/Angular client + NestJS API (`backend/`). See `backend/README.md` for API details.

## Prerequisites

- **Node.js** — current LTS (v20+ recommended) and npm.
- **PostgreSQL** — 15+ with a database named `champ_dev` (or adjust `DATABASE_URL`).
- **Git** — clone the open repo.

Secrets stay local: copy `.env.example` files; never commit real `.env`.

## Getting started (clone → run)

```bash
git clone <your-repo-url>
cd champ-app
```

### 1. API (`backend/`)

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (≥32 chars each for anything beyond local dev)
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

API listens on **http://localhost:3000**. Health: `GET http://localhost:3000/health`.

### 2. Frontend (repo root)

New terminal from project root:

```bash
npm install
npm start
```

App: **http://localhost:4200**. Angular dev server proxies **`/api`** to `http://localhost:3000` (`proxy.conf.json`), so the browser talks to one origin.

Optional seed data: from `backend/`, `npm run prisma:seed` if you use the seeded workflow.

## Dev (quick reference)

```bash
# Terminal 1 — API
cd backend && npm install && npx prisma generate && npx prisma db push && npm run start:dev

# Terminal 2 — app
npm install && npm start
```

## iOS auth verification

Capacitor/WKWebView can differ from desktop Chrome for cookies and origins. Before release, run this checklist (simulator minimum):

1. `ionic capacitor sync ios`
2. Open the Xcode workspace under `ios/App/App.xcworkspace`
3. Sign in on the simulator with a test account
4. Force-quit the app, relaunch, and confirm you are still authenticated (refresh cookie + `/users/me`)
5. Repeat on a physical device if available

**Settings used in dev:** Angular dev server proxies `/api` to `http://localhost:3000`; cookies are `httpOnly`, `SameSite=Lax`, `Secure` only when `NODE_ENV=production`. If refresh fails on device, capture WKWebView console logs and open a follow-up — device-only failures are documented but do not block merge.
