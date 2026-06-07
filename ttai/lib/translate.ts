/**
 * Machine-translation provider abstraction (server-only).
 *
 * Source language is auto-detected — content can be written in any language.
 * Provider is chosen with TRANSLATION_PROVIDER (default 'openai'):
 *   openai    → OPENAI_API_KEY   (gpt; model from OPENAI_TRANSLATE_MODEL)
 *   anthropic → ANTHROPIC_API_KEY
 *   deepl     → DEEPL_API_KEY
 *
 * On any error it returns the original text (never breaks the page).
 */

import { createAdminClient } from '@/lib/supabase/admin'

const LANG_NAME: Record<string, string> = {
  en: 'English', fr: 'French', es: 'Spanish', de: 'German', pt: 'Portuguese', ar: 'Arabic',
}

export type Provider = 'openai' | 'anthropic' | 'deepl'

interface TConfig { enabled: boolean; provider: Provider; openaiKey?: string; anthropicKey?: string; deeplKey?: string }

// Settings are admin-managed in app_settings; cache for 30s to avoid re-querying.
let _cfg: { cfg: TConfig; at: number } | null = null

export async function getTranslationConfig(): Promise<TConfig> {
  if (_cfg && Date.now() - _cfg.at < 30_000) return _cfg.cfg
  let m: Record<string, string> = {}
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('app_settings') as any).select('key, value').like('key', 'translation_%')
    m = Object.fromEntries(((data ?? []) as any[]).map((r) => [r.key, r.value]))
  } catch { /* table may not exist yet — fall back to env */ }

  const provRaw = (m.translation_provider || process.env.TRANSLATION_PROVIDER || 'openai').toLowerCase()
  const cfg: TConfig = {
    enabled: (m.translation_enabled ?? 'true') !== 'false',
    provider: (['openai', 'anthropic', 'deepl'] as const).includes(provRaw as Provider) ? (provRaw as Provider) : 'openai',
    openaiKey:    m.translation_openai_key    || process.env.OPENAI_API_KEY,
    anthropicKey: m.translation_anthropic_key || process.env.ANTHROPIC_API_KEY,
    deeplKey:     m.translation_deepl_key      || process.env.DEEPL_API_KEY,
  }
  _cfg = { cfg, at: Date.now() }
  return cfg
}

/** Clear the cached config (call after the admin saves new settings). */
export function clearTranslationConfigCache() { _cfg = null }

/** Translate one text to `target` (a locale code). Returns the original on failure/disabled. */
export async function translateText(text: string, target: string): Promise<string> {
  const clean = (text ?? '').trim()
  if (!clean) return text
  const cfg = await getTranslationConfig()
  if (!cfg.enabled) return text
  const targetName = LANG_NAME[target] ?? target
  try {
    if (cfg.provider === 'deepl') {
      if (!cfg.deeplKey) return text
      return await viaDeepL(clean, target, cfg.deeplKey)
    }
    if (cfg.provider === 'anthropic') {
      if (!cfg.anthropicKey) return text
      return await viaAnthropic(clean, targetName, cfg.anthropicKey)
    }
    if (!cfg.openaiKey) return text
    return await viaOpenAI(clean, targetName, cfg.openaiKey)
  } catch (e) {
    console.error('translateText failed:', (e as Error).message)
    return text
  }
}

const SYSTEM = (targetName: string) =>
  `You are a professional translation engine for a B2B marketplace. Detect the source language automatically and translate the user's text into ${targetName}. Return ONLY the translated text — no quotes, no notes, no explanations. Preserve line breaks, numbers, brand names and units.`

async function viaOpenAI(text: string, targetName: string, key: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATE_MODEL ?? 'gpt-4o-mini',
      temperature: 0,
      messages: [{ role: 'system', content: SYSTEM(targetName) }, { role: 'user', content: text }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content ?? text).trim()
}

async function viaAnthropic(text: string, targetName: string, key: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_TRANSLATE_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM(targetName),
      messages: [{ role: 'user', content: text }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}`)
  const data = await res.json()
  return (data.content?.[0]?.text ?? text).trim()
}

async function viaDeepL(text: string, target: string, key: string): Promise<string> {
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
  const res = await fetch(`${host}/v2/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${key}` },
    body: JSON.stringify({ text: [text], target_lang: target.toUpperCase() }),
  })
  if (!res.ok) throw new Error(`DeepL ${res.status}`)
  const data = await res.json()
  return (data.translations?.[0]?.text ?? text).trim()
}
