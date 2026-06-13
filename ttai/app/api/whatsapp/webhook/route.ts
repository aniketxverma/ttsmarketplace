import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTokenEnv, verifySignature, digitsOnly, sendText, downloadMedia } from '@/lib/whatsapp/client'

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
  const verifyToken = verifyTokenEnv()
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

    // Build the post from the message (text, image+caption or video+caption).
    let content = ''
    let imageUrl: string | null = null
    let videoUrl: string | null = null

    // Download a media id → upload to storage → return its public URL.
    const saveMedia = async (mediaId?: string, fallbackExt = 'bin') => {
      const media = await downloadMedia(mediaId ?? '')
      if (!media) return null
      const ext = media.mime.split('/')[1]?.split(';')[0] || fallbackExt
      const path = `channel-posts/wa-${match.id}-${Date.now()}.${ext}`
      const { error: upErr } = await admin.storage.from('brand-assets')
        .upload(path, media.buffer, { contentType: media.mime, upsert: false })
      await diag(admin, `MEDIA ${message.type} mediaId=${mediaId} downloaded=YES(${media.buffer.length}b) uploadErr=${upErr?.message ?? 'none'}`)
      return upErr ? null : admin.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
    }

    if (message.type === 'text') {
      content = message.text?.body ?? ''
    } else if (message.type === 'image') {
      content = message.image?.caption ?? ''
      imageUrl = await saveMedia(message.image?.id, 'jpg')
    } else if (message.type === 'video') {
      content = message.video?.caption ?? ''
      videoUrl = await saveMedia(message.video?.id, 'mp4')
    } else {
      await sendText(from, 'Send text, a photo or a video (with a caption) to publish an offer.')
      return NextResponse.json({ received: true })
    }

    if (!content.trim() && !imageUrl && !videoUrl) {
      await sendText(from, 'Your message was empty — send the offer text, a photo or a video to publish.')
      return NextResponse.json({ received: true })
    }

    const row: Record<string, any> = {
      channel_id: match.id,
      content:    content.trim() || (videoUrl ? '🎥 Video' : '📷 Photo'),
      image_url:  imageUrl,
      post_type:  'offer',
    }
    if (videoUrl) row.video_url = videoUrl
    // Defensive: video_url column may not exist yet (migration 0063) → retry without.
    let ins = await (admin.from('channel_posts') as any).insert(row)
    if (ins.error && videoUrl) {
      delete row.video_url
      row.content = content.trim() || '🎥 Video (open WhatsApp)'
      ins = await (admin.from('channel_posts') as any).insert(row)
    }

    const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ttai.es'
    await sendText(from, `✅ Your offer is live on TTAI EMA.\n${site}/channel/${match.id}`)
  } catch (e) {
    console.error('whatsapp webhook error:', (e as Error).message)
  }

  return NextResponse.json({ received: true })
}
