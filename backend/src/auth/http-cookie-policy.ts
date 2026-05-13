import type { CookieOptions } from 'express';

/**
 * Auth + OAuth session cookies. When SPA and API are different sites (e.g. two Render URLs),
 * set AUTH_COOKIE_SAMESITE=none so Set-Cookie is not blocked on cross-site XHR; requires Secure.
 */
export function sharedBrowserCookieOptions(): Pick<
  CookieOptions,
  'httpOnly' | 'sameSite' | 'secure' | 'path'
> {
  const raw = process.env.AUTH_COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSiteNone = raw === 'none';
  const sameSite: CookieOptions['sameSite'] =
    raw === 'strict' ? 'strict' : sameSiteNone ? 'none' : 'lax';
  // SameSite=None must be paired with Secure (browser rule).
  const secure = sameSiteNone ? true : process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
  };
}
