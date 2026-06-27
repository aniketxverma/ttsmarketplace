import { createHash } from 'crypto'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { TranslationManager } from './TranslationManager'

export const dynamic = 'force-dynamic'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', ar: 'Arabic', fr: 'French',
  de: 'German', pt: 'Portuguese', ru: 'Russian', fa: 'Persian',
}
const sha = (s: string) => createHash('sha256').update(s.trim()).digest('hex')

export default async function AdminTranslationsPage() {
  await requireRole('admin')

  const tt = await localizeUI(["Translations"], getLocale())
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

  // Total published products + the hashes of every translatable field (name AND
  // description). A product counts as translated for a language only when ALL its
  // fields are cached in that language.
  const { count: productCount } = await admin.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true)
  const total = productCount ?? 0
  const products: { hashes: string[] }[] = []
  for (let off = 0; off < total + 1000; off += 1000) {
    const { data } = await admin.from('products').select('name, description').eq('is_published', true).order('id').range(off, off + 999)
    if (!data || !data.length) break
    for (const p of data as any[]) {
      const hashes: string[] = []
      if (p.name && String(p.name).trim()) hashes.push(sha(String(p.name)))
      if (p.description && String(p.description).trim()) hashes.push(sha(String(p.description)))
      if (hashes.length) products.push({ hashes })
    }
    if (data.length < 1000) break
  }

  // Per language: the set of cached source hashes (so we can test full-product coverage).
  const perLangSet: Record<string, Set<string>> = {}
  for (const l of targets) perLangSet[l] = new Set()
  let cachedCount = 0
  for (let off = 0; off < 200000; off += 1000) {
    const { data } = await (admin.from('content_translations') as any).select('source_hash, target_lang').order('id').range(off, off + 999)
    if (!data || !data.length) break
    for (const r of data as any[]) {
      cachedCount++
      perLangSet[r.target_lang]?.add(r.source_hash)
    }
    if (data.length < 1000) break
  }

  // A product is "translated" in a language only when EVERY field hash is cached.
  const stats = targets.map((l) => {
    const set = perLangSet[l]
    let done = 0
    for (const p of products) if (p.hashes.every((h) => set.has(h))) done++
    return { lang: l, name: LOCALE_NAMES[l] ?? l.toUpperCase(), translated: done, total: products.length, cached: set.size }
  })
  const totalForUi = products.length

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{tt("Translations")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {total} published products · {cachedCount} cached translations across {targets.length} languages.
          Pick a provider, add your API key, and the marketplace auto-translates content into each visitor&apos;s language.
        </p>
      </div>
      <TranslationManager initial={initial} stats={stats} targetLangs={targets} localeNames={LOCALE_NAMES} totalProducts={totalForUi} />
    </div>
  )
}
