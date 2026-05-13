# Champ API (NestJS)

## Run

1. Install PostgreSQL 15+ (or Docker) and create database `champ_dev`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (each ≥32 characters in production).
3. From this directory:

```bash
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

`npm run build` (e.g. for production) runs `prisma generate` automatically via `prebuild`, then compiles the API.

After any Prisma schema change, run `npx prisma db push` again (or migrate in production).

Health check: `GET http://localhost:3000/health`

## Auth cookies (Ionic client)

- **access_token** — JWT (15m), `httpOnly`, `SameSite=Lax`, `Secure` in production.
- **refresh_token** — opaque token (hashed in DB), same cookie flags, rotated on `POST /auth/refresh`.

The JWT is accepted from **Authorization: Bearer** or the **access_token** cookie (see `jwt-access.strategy.ts`).

## Email in production

Password reset uses **stdout logging in development only** (`NODE_ENV=development`). In production, dev logging is disabled — wire a transactional provider using env placeholders:

- `EMAIL_PROVIDER` — e.g. `resend`, `sendgrid`, `ses`
- `RESEND_API_KEY` — API key for Resend (or equivalent for other providers)

Implement sending in place of `[DEV ONLY]` logs before going live.

## Optional

- `npx prisma studio` — browse local data.
