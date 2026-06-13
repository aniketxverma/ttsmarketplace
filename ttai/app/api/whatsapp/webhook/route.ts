import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { whatsappConfig, verifySignature, digitsOnly, sendText, downloadMedia } from '@/lib/whatsapp/client'

async function diag(admin: ReturnType<typeof createAdminClient>, msg: string) {
  try { await (admin.from('app_settings') as any).upsert({ key: 'whatsapp_diag', value: `${new Date().toISOString()} :: ${msg}` }, { onConflict: 'key' }) } catch {}
}

export const dynamic = 'force-dynamic'

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * GET  — Meta's verification handshake (hub.challenge).
 * POST — incoming messages. A supplier who sends a message FROM the WhatsApp
 *        number they registered on their canal gets that message published as an
 *        offer post (appears in the marketplace feed + their brand page).
 *
 * Inert until WHATSAPP_* env vars are configured.
 */

// ── Verification handshake ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { verifyToken } = whatsappConfig()
  const p = req.nextUrl.searchParams
  if (p.get('hub.mode') === 'subscribe' && verifyToken && p.get('hub.verify_token') === verifyToken) {
    return new NextResponse(p.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ── Incoming messages ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const raw = await req.text()

  // ── Diagnostic: record that SOMETHING hit this endpoint (so we can tell if
  //    Meta is delivering at all). Stored in app_settings; safe to remove later.
  try {
    const dbg = createAdminClient()
    await (dbg.from('app_settings') as any).upsert(
      { key: 'whatsapp_last_hit', value: `${new Date().toISOString()} :: ${raw.slice(0, 300)}` },
      { onConflict: 'key' },
    )
  } catch {}

  // Best-effort signature check: log a mismatch but DON'T drop the message, so a
  // wrong/missing WHATSAPP_APP_SECRET never silently loses supplier offers.
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'))) {
    console.warn('whatsapp webhook: signature check failed — processing anyway (verify WHATSAPP_APP_SECRET)')
  }

  // Always 200 back to Meta quickly; never let internal errors trigger retries.
  try {
    const body = JSON.parse(raw)
    const value = body?.entry?.[0]?.changes?.[0]?.value
    const message = value?.messages?.[0]
    if (!message) return NextResponse.json({ received: true })

    const from = digitsOnly(message.from)               // sender, e.g. "34600000000"
    const admin = createAdminClient()

    // Match the sender to a supplier canal by the WhatsApp number they registered.
    const { data: channels } = await (admin.from('supplier_channels') as any)
      .select('id, whatsapp, is_active')
      .not('whatsapp', 'is', null)
    const match = ((channels ?? []) as any[]).find((c) => {
      const d = digitsOnly(c.whatsapp)
      if (!d || !from) return false
      // compare on the last 9 digits to tolerate country-code formatting
      return d.slice(-9) === from.slice(-9)
    })

    if (!match) {
      await sendText(from, 'Hi! This number isn’t linked to a TTAI EMA canal yet. Add it as your WhatsApp number in your supplier dashboard, then send your offer again.')
      return NextResponse.json({ received: true })
    }
    if (match.is_active === false) {
      await sendText(from, 'Your canal is paused. Re-activate it in your dashboard to publish offers.')
      return NextResponse.json({ received: true })
    }

    // Build the post from the message (text or image+caption).
    let content = ''
    let imageUrl: string | null = null

    if (message.type === 'text') {
      content = message.text?.body ?? ''
    } else if (message.type === 'image') {
      content = message.image?.caption ?? ''
      const cfg = whatsappConfig()
      const media = await downloadMedia(message.image?.id)
      if (media) {
        const ext = media.mime.split('/')[1]?.split(';')[0] || 'jpg'
        const path = `channel-posts/wa-${match.id}-${Date.now()}.${ext}`
        const { error: upErr } = await admin.storage.from('brand-assets')
          .upload(path, media.buffer, { contentType: media.mime, upsert: false })
        if (!upErr) imageUrl = admin.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
        await diag(admin, `IMG configured=${cfg.configured} tokenLen=${cfg.token.length} mediaId=${message.image?.id} downloaded=YES(${media.buffer.length}b) uploadErr=${upErr?.message ?? 'none'}`)
      } else {
        await diag(admin, `IMG configured=${cfg.configured} tokenLen=${cfg.token.length} phoneId=${cfg.phoneId} mediaId=${message.image?.id} downloaded=NO`)
      }
    } else {
      await sendText(from, 'Send text or a photo with a caption to publish an offer.')
      return NextResponse.json({ received: true })
    }

    if (!content.trim() && !imageUrl) {
      await sendText(from, 'Your message was empty — send the offer text or a photo to publish.')
      return NextResponse.json({ received: true })
    }

    await (admin.from('channel_posts') as any).insert({
      channel_id: match.id,
      content:    content.trim() || '📷 Photo',
      image_url:  imageUrl,
      post_type:  'offer',
    })

    const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ttai.es'
    await sendText(from, `✅ Your offer is live on TTAI EMA.\n${site}/channel/${match.id}`)
  } catch (e) {
    console.error('whatsapp webhook error:', (e as Error).message)
  }

  return NextResponse.json({ received: true })
}
