/**
 * Cached dynamic-content translation (server-only).
 *
 * translateCached(text, locale) returns the text in the viewer's language,
 * translating once and caching in `content_translations`. Source language is
 * auto-detected, so content authored in any language works.
 */
import 'server-only'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { translateText } from '@/lib/translate'

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

export async function translateCached(text: string, target: string): Promise<string> {
  const clean = (text ?? '').trim()
  if (!clean || !target) return text
  const hash = sha(clean)
  const admin = createAdminClient()

  const { data } = await (admin.from('content_translations') as any)
    .select('translated').eq('source_hash', hash).eq('target_lang', target).maybeSingle()
  if (data?.translated) return data.translated

  const translated = await translateText(clean, target)
  if (translated && translated !== clean) {
    await (admin.from('content_translations') as any)
      .upsert({ source_hash: hash, target_lang: target, translated }, { onConflict: 'source_hash,target_lang' })
  }
  return translated
}

/** Translate several texts at once (parallel, each cached). */
export async function translateMany(texts: (string | null | undefined)[], target: string): Promise<string[]> {
  return Promise.all(texts.map((t) => translateCached(t ?? '', target)))
}
