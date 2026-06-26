import 'server-only'
import crypto from 'crypto'

// Cookie names: signed (httpOnly) proof of the original admin, + a readable
// marker (target label) so the dashboard can show the "Return to admin" banner.
export const IMP_COOKIE = 'ttai_imp'
export const IMP_LABEL_COOKIE = 'ttai_imp_label'
const TTL_MS = 8 * 60 * 60 * 1000

const SECRET = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ttaiema-dev-secret'

/** Sign { adminId, exp } so only the server (with SECRET) can mint a valid token. */
export function signImpersonation(adminId: string): string {
  const payload = Buffer.from(JSON.stringify({ a: adminId, e: Date.now() + TTL_MS })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/** Returns the original admin id if the token is valid & unexpired, else null. */
export function verifyImpersonation(token?: string | null): string | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  try {
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const { a: adminId, e } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!adminId || Date.now() > e) return null
    return adminId as string
  } catch {
    return null
  }
}
