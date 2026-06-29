/**
 * Public base URL for SHAREABLE links (invites, password reset, emails). These
 * are opened by other people, so they must never be localhost. Prefers
 * NEXT_PUBLIC_APP_URL when it's a real public URL, otherwise the production
 * domain — even if the env var is missing or points at localhost.
 */
export function appBaseUrl(): string {
  const u = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '')
  if (u && !/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(u)) return u
  return 'https://ttaiz.com'
}
