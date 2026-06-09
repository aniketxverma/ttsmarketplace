import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clearTranslationConfigCache } from '@/lib/translate'
import { translateMany } from '@/lib/i18n/content'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/locales'

export const maxDuration = 300

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return me?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json().catch(() => ({})) as any
  const admin = createAdminClient()

  // ── Save settings ──────────────────────────────────────────────────────
  if (body.action === 'save') {
    const rows: { key: string; value: string }[] = []
    if (body.enabled !== undefined)  rows.push({ key: 'translation_enabled', value: body.enabled ? 'true' : 'false' })
    if (body.provider)               rows.push({ key: 'translation_provider', value: String(body.provider) })
    // Only overwrite a key when a non-empty value is provided (blank = keep existing).
    if (body.openaiKey)    rows.push({ key: 'translation_openai_key', value: String(body.openaiKey) })
    if (body.anthropicKey) rows.push({ key: 'translation_anthropic_key', value: String(body.anthropicKey) })
    if (body.deeplKey)     rows.push({ key: 'translation_deepl_key', value: String(body.deeplKey) })
    if (rows.length) {
      const { error } = await (admin.from('app_settings') as any)
        .upsert(rows.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'key' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    clearTranslationConfigCache()
    return NextResponse.json({ ok: true })
  }

  // ── Backfill: translate published products into all languages ───────────
  // Resumable in small batches so a single request never times out at the gateway.
  if (body.action === 'backfill') {
    try {
      const targets = SUPPORTED_LOCALES.filter(l => l !== DEFAULT_LOCALE) // skip source default
      const BATCH = Math.min(Math.max(Number(body.batch) || 3, 1), 8)
      const offset = Math.max(Number(body.offset) || 0, 0)

      const { count } = await (admin.from('products') as any)
        .select('id', { count: 'exact', head: true }).eq('is_published', true)
      const total = count ?? 0

      const { data: products } = await (admin.from('products') as any)
        .select('id, name, description').eq('is_published', true)
        .order('id', { ascending: true }).range(offset, offset + BATCH - 1)

      let texts = 0
      for (const p of (products ?? []) as any[]) {
        // All languages for this product in parallel (name + description each).
        await Promise.all(targets.map((lang) => translateMany([p.name, p.description], lang)))
        texts += targets.length * 2
      }

      const processed = (products ?? []).length
      const nextOffset = offset + processed
      return NextResponse.json({
        ok: true, total, languages: targets.length, processed, texts,
        nextOffset, done: nextOffset >= total || processed === 0,
      })
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? 'Translation failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
