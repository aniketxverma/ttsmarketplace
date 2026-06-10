import 'server-only'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const sha = (s: string) => createHash('sha256').update(s.trim()).digest('hex')

/**
 * Replace category `name` with its stored translation for `locale` (from the
 * content_translations cache). One batched query for the whole list; falls back
 * to the original name when no translation exists. No-op for the default locale.
 */
export async function localizeCategoryNames<T extends { name?: string | null }>(cats: T[], locale: string): Promise<T[]> {
  // Always return a NEW array — callers may replace their list in place
  // (`list.length = 0; list.push(...result)`), which would self-empty if we
  // returned the same reference on the no-op path.
  if (!locale || locale === 'en' || !cats?.length) return cats.slice()
  try {
    const names = Array.from(new Set(cats.map((c) => (c.name ?? '').trim()).filter(Boolean)))
    if (!names.length) return cats.slice()
    const hashes = names.map(sha)
    const admin = createAdminClient()
    const { data } = await (admin.from('content_translations') as any)
      .select('source_hash, translated').eq('target_lang', locale).in('source_hash', hashes)
    const byHash = new Map((data ?? []).map((r: any) => [r.source_hash, r.translated]))
    return cats.map((c) => {
      const n = (c.name ?? '').trim()
      const tr = n && byHash.get(sha(n))
      return tr ? { ...c, name: tr } : c
    })
  } catch {
    return cats.slice()
  }
}

/** Same as above but for any list of objects with a `name` (e.g. products). */
export const localizeNames = localizeCategoryNames
