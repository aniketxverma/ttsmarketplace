import 'server-only'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { translateCached } from '@/lib/i18n/content'

const sha = (s: string) => createHash('sha256').update(s.trim()).digest('hex')

/**
 * Translate a set of static UI strings for the current locale using the shared
 * content_translations cache. Cache MISSES are translated in the background
 * (fire-and-forget) so the string shows English on first view and the cached
 * translation on every view after — the platform self-translates as it's used.
 * Pre-warm with scripts/translate-content.js to translate the first view too.
 *
 *   const tt = await localizeUI(['Shop', 'Contact'], locale)
 *   tt('Shop')  // 'Tienda' in es once cached, else 'Shop'
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

      // Background-fill any misses so they're cached for next time.
      const missing = uniq.filter((t) => !map.has(t))
      if (missing.length) void Promise.all(missing.map((t) => translateCached(t, locale))).catch(() => {})
    }
  } catch { /* fall back to English */ }
  return (s: string) => map.get((s ?? '').trim()) ?? s
}
