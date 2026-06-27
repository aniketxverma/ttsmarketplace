import { createHash } from 'crypto'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { TranslationManager } from './TranslationManager'

export const dynamic = 'force-dynamic'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', ar: 'Arabic', fr: 'French',
  de: 'German', pt: 'Portuguese', ru: 'Russian', fa: 'Persian',
}
const sha = (s: string) => createHash('sha256').update(s.trim()).digest('hex')

export default async function AdminTranslationsPage() {
  await requireRole('admin')
  const admin = createAdminClient()

  const { data: settingsRows } = await (admin.from('app_settings') as any).select('key, value').like('key', 'translation_%')
  const s: Record<string, string> = Object.fromEntries(((settingsRows ?? []) as any[]).map((r) => [r.key, r.value]))
  const initial = {
    enabled: (s.translation_enabled ?? 'true') !== 'false',
    provider: s.translation_provider || 'openai',
    hasOpenai: !!s.translation_openai_key,
    hasAnthropic: !!s.translation_anthropic_key,
    hasDeepl: !!s.translation_deepl_key,
  }

  const targets = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE)

  // Total published products + their name hashes (the per-product translation marker).
  const { count: productCount } = await admin.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true)
  const total = productCount ?? 0
  const nameHashes = new Set<string>()
  for (let off = 0; off < total + 1000; off += 1000) {
    const { data } = await admin.from('products').select('name').eq('is_published', true).order('id').range(off, off + 999)
    if (!data || !data.length) break
    for (const p of data as any[]) if (p.name) nameHashes.add(sha(String(p.name)))
    if (data.length < 1000) break
  }

  // Walk the translation cache once: per language, how many product names are translated + total cached rows.
  const perLang: Record<string, { products: number; cached: number }> = {}
  for (const l of targets) perLang[l] = { products: 0, cached: 0 }
  let cachedCount = 0
  for (let off = 0; off < 200000; off += 1000) {
    const { data } = await (admin.from('content_translations') as any).select('source_hash, target_lang').order('id').range(off, off + 999)
    if (!data || !data.length) break
    for (const r of data as any[]) {
      cachedCount++
      const pl = perLang[r.target_lang]
      if (!pl) continue
      pl.cached++
      if (nameHashes.has(r.source_hash)) pl.products++
    }
    if (data.length < 1000) break
  }

  const stats = targets.map((l) => ({
    lang: l,
    name: LOCALE_NAMES[l] ?? l.toUpperCase(),
    translated: Math.min(perLang[l].products, total),
    total,
    cached: perLang[l].cached,
  }))

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Translations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {total} published products · {cachedCount} cached translations across {targets.length} languages.
          Pick a provider, add your API key, and the marketplace auto-translates content into each visitor&apos;s language.
        </p>
      </div>
      <TranslationManager initial={initial} stats={stats} targetLangs={targets} localeNames={LOCALE_NAMES} totalProducts={total} />
    </div>
  )
}
