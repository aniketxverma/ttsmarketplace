/**
 * Meta WhatsApp Cloud API helpers (server-only).
 *
 * Lets suppliers post offers by sending a WhatsApp message to the central TTAI
 * EMA business number. Configure in the environment:
 *
 *   WHATSAPP_TOKEN            – permanent access token (System User token)
 *   WHATSAPP_PHONE_NUMBER_ID  – the business number's phone_number_id
 *   WHATSAPP_VERIFY_TOKEN     – any string you choose; used for webhook setup
 *   WHATSAPP_APP_SECRET       – the app secret (validates incoming signatures)
 *
 * Until these are set the webhook is inert (returns 200, does nothing).
 */
import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'

const GRAPH = 'https://graph.facebook.com/v21.0'

export function whatsappConfig() {
  return {
    token:        process.env.WHATSAPP_TOKEN || '',
    phoneId:      process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken:  process.env.WHATSAPP_VERIFY_TOKEN || '',
    appSecret:    process.env.WHATSAPP_APP_SECRET || '',
    configured:   !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  }
}

/** Validate Meta's `x-hub-signature-256` header against the raw request body. */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const { appSecret } = whatsappConfig()
  if (!appSecret) return true // not configured → don't block (stub mode)
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
  const { token, phoneId, configured } = whatsappConfig()
  if (!configured) return
  try {
    await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    })
  } catch (e) {
    console.error('whatsapp sendText failed:', (e as Error).message)
  }
}

/** Resolve a media id to its temporary download URL, then fetch the bytes. */
export async function downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const { token, configured } = whatsappConfig()
  if (!configured) return null
  try {
    const metaRes = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!metaRes.ok) return null
    const meta = await metaRes.json() as { url?: string; mime_type?: string }
    if (!meta.url) return null
    const binRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } })
    if (!binRes.ok) return null
    const buffer = Buffer.from(await binRes.arrayBuffer())
    return { buffer, mime: meta.mime_type ?? 'image/jpeg' }
  } catch (e) {
    console.error('whatsapp downloadMedia failed:', (e as Error).message)
    return null
  }
}
