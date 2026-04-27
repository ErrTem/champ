export const environment = {
  production: false,
  /** Direct API (no dev proxy); use when not serving via `ng serve` proxy. */
  apiUrl: 'http://localhost:3000',
  /** Web Push VAPID public key (base64url). */
  vapidPublicKey: '',
  /** Local UI-only mode (no backend required). */
  mockCatalog: false,
};
