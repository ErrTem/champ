export const environment = {
  production: false,
  /** Dev server proxy: see `proxy.conf.json` → Nest on :3000 */
  apiUrl: '/api',
  /** Web Push VAPID public key (base64url). */
  vapidPublicKey: '',
  /** Use backend APIs in dev by default. */
  mockCatalog: false,
};
