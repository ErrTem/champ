# Deploy Champ on Render

Repo includes a [Blueprint](https://render.com/docs/infrastructure-as-code) at `render.yaml`: Postgres (`champ-db`), Docker API (`champ-api`), static Ionic/Angular app (`champ-web`).

## One-time setup

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Render Dashboard](https://dashboard.render.com): **New** → **Blueprint** → select the repo and `render.yaml`.
3. When prompted, set **ADMIN_EMAIL** and **ADMIN_PASSWORD** for the API service (used by the container entrypoint for initial admin + seed). Use a strong password.

## URLs and CORS

Blueprint assumes public URLs:

- API: `https://champ-api.onrender.com`
- Web: `https://champ-web.onrender.com`

If Render assigns different hostnames (name collision), update in the dashboard:

- On **champ-api**: `CORS_ORIGINS` — comma-separated list of exact frontend origins (e.g. `https://your-web.onrender.com`).
- On **champ-web**: `API_PUBLIC_URL` — your API origin, then **Manual Deploy** so the static build re-runs with `scripts/render-inject-api-url.js`.

## Local check before push

```bash
# API
cd backend && npm run build

# Web (optional; overwrites apiUrl in environment.prod.ts for this run only — revert with git if needed)
cd .. && set API_PUBLIC_URL=https://champ-api.onrender.com&& npm run build:render
```

## Notes

- Free Postgres has [limits and expiry](https://render.com/docs/free#free-postgresql); upgrade for production data.
- OAuth (Google/Apple), Stripe, email, and VAPID keys are not in the blueprint; add them as env vars on **champ-api** / **champ-web** (`VAPID_PUBLIC_KEY` on the static site build if you use push).
- API runs `prisma migrate deploy` then seed on each container start; keep seeds idempotent if you change them.
