import 'server-only'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const sha = (s: string) => createHash('sha256').update(s.trim()).digest('hex')

/**
 * Translate a set of static UI strings for the current locale using the shared
 * content_translations cache (filled by scripts/translate-content.js ui). Returns
 * a tt(text) function that yields the translation or the original English.
 *
 *   const tt = await localizeUI(['Shop', 'Contact'], locale)
 *   tt('Shop')  // 'Tienda' in es, 'Shop' if not cached
 */
export async function localizeUI(texts: string[], locale: string): Promise<(s: string) => string> {
  if (!locale || locale === 'en') return (s) => s
  const map = new Map<string, string>()
  try {
    const uniq = Array.from(new Set(texts.map((t) => (t ?? '').trim()).filter(Boolean)))
    if (uniq.length) {
      const hashes = uniq.map(sha)
      const admin = createAdminClient()
      const rows: { source_hash: string; translated: string }[] = []
      for (let i = 0; i < hashes.length; i += 300) {
        const { data } = await (admin.from('content_translations') as any)
          .select('source_hash, translated').eq('target_lang', locale).in('source_hash', hashes.slice(i, i + 300))
        rows.push(...((data ?? []) as any[]))
      }
      const byHash = new Map(rows.map((r) => [r.source_hash, r.translated]))
      for (const t of uniq) { const tr = byHash.get(sha(t)); if (tr) map.set(t, tr) }
    }
  } catch { /* fall back to English */ }
  return (s: string) => map.get((s ?? '').trim()) ?? s
}
