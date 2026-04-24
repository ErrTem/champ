# Champ

Ionic/Angular client + NestJS API (`backend/`). See `backend/README.md` for API setup.

## Dev

```bash
# Terminal 1 — API (needs PostgreSQL + `.env` in `backend/`)
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# Terminal 2 — app (`ng serve` uses `/api` proxy → :3000)
npm install
npm start
```

## iOS auth verification

Capacitor/WKWebView can differ from desktop Chrome for cookies and origins. Before release, run this checklist (simulator minimum):

1. `ionic capacitor sync ios`
2. Open the Xcode workspace under `ios/App/App.xcworkspace`
3. Sign in on the simulator with a test account
4. Force-quit the app, relaunch, and confirm you are still authenticated (refresh cookie + `/users/me`)
5. Repeat on a physical device if available

**Settings used in dev:** Angular dev server proxies `/api` to `http://localhost:3000`; cookies are `httpOnly`, `SameSite=Lax`, `Secure` only when `NODE_ENV=production`. If refresh fails on device, capture WKWebView console logs and open a follow-up — device-only failures are documented but do not block merge.
