/**
 * Meta WhatsApp Cloud API helpers (server-only).
 *
 * Config can come from the environment OR from app_settings (DB override) — the
 * DB wins. This lets us rotate the token without touching the host's env:
 *   app_settings: wa_token, wa_phone_id, wa_app_secret, wa_verify_token
 * Env fallback:  WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET,
 *                WHATSAPP_VERIFY_TOKEN
 */
import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const GRAPH = 'https://graph.facebook.com/v21.0'

interface WAConfig { token: string; phoneId: string; verifyToken: string; appSecret: string; configured: boolean }

// DB overrides, cached 20s.
let _ov: { v: Record<string, string>; at: number } | null = null
async function overrides(): Promise<Record<string, string>> {
  if (_ov && Date.now() - _ov.at < 20_000) return _ov.v
  let v: Record<string, string> = {}
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('app_settings') as any).select('key, value').like('key', 'wa_%')
    v = Object.fromEntries(((data ?? []) as any[]).map((r) => [r.key, r.value]))
  } catch { /* table may be unavailable */ }
  _ov = { v, at: Date.now() }
  return v
}

export async function whatsappConfig(): Promise<WAConfig> {
  const o = await overrides()
  const token       = o.wa_token        || process.env.WHATSAPP_TOKEN || ''
  const phoneId     = o.wa_phone_id     || process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  const verifyToken = o.wa_verify_token || process.env.WHATSAPP_VERIFY_TOKEN || ''
  const appSecret   = o.wa_app_secret   || process.env.WHATSAPP_APP_SECRET || ''
  return { token, phoneId, verifyToken, appSecret, configured: !!(token && phoneId) }
}

/** Synchronous verify-token read (env only) — used by the GET handshake. */
export function verifyTokenEnv(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN || ''
}

/** Validate Meta's `x-hub-signature-256` header (best-effort; env secret). */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET || ''
  if (!appSecret) return true
  if (!signatureHeader?.startsWith('sha256=')) return false
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Keep only digits — used to compare phone numbers across formats. */
export function digitsOnly(s?: string | null): string {
  return (s ?? '').replace(/\D/g, '')
}

/** Send a plain text WhatsApp reply to a number (E.164 digits, no '+'). */
export async function sendText(to: string, body: string): Promise<void> {
  const cfg = await whatsappConfig()
  if (!cfg.configured) return
  try {
    await fetch(`${GRAPH}/${cfg.phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    })
  } catch (e) {
    console.error('whatsapp sendText failed:', (e as Error).message)
  }
}

/** Resolve a media id to its temporary download URL, then fetch the bytes. */
export async function downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const cfg = await whatsappConfig()
  if (!cfg.configured) return null
  try {
    const metaRes = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${cfg.token}` } })
    if (!metaRes.ok) return null
    const meta = await metaRes.json() as { url?: string; mime_type?: string }
    if (!meta.url) return null
    const binRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${cfg.token}` } })
    if (!binRes.ok) return null
    const buffer = Buffer.from(await binRes.arrayBuffer())
    return { buffer, mime: meta.mime_type ?? 'image/jpeg' }
  } catch (e) {
    console.error('whatsapp downloadMedia failed:', (e as Error).message)
    return null
  }
}
