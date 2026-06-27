require('dotenv').config({ path: '.env.local' })
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TARGETS = { es: 'Spanish', ar: 'Arabic', fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian', fa: 'Persian (Farsi)' }
const MODEL = process.env.OPENAI_TRANSLATE_MODEL || 'gpt-4o-mini'
const CONCURRENCY = 16
const sha = (s) => crypto.createHash('sha256').update(String(s).trim()).digest('hex')
const SYSTEM = (t) => `You are a professional translation engine for a B2B marketplace. Detect the source language automatically and translate the user's text into ${t}. Return ONLY the translated text — no quotes, no notes, no explanations. Preserve line breaks, numbers, brand names and units.`

async function translate(text, langName, key, tries = 0) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, temperature: 0, messages: [{ role: 'system', content: SYSTEM(langName) }, { role: 'user', content: text }] }),
    })
    if (res.status === 429 || res.status >= 500) { if (tries < 5) { await new Promise(r => setTimeout(r, 1500 * (tries + 1))); return translate(text, langName, key, tries + 1) } throw new Error('rate/'+res.status) }
    if (!res.ok) throw new Error('OpenAI ' + res.status)
    const data = await res.json()
    return (data.choices?.[0]?.message?.content ?? '').trim()
  } catch (e) { if (tries < 5) { await new Promise(r => setTimeout(r, 1500 * (tries + 1))); return translate(text, langName, key, tries + 1) } throw e }
}

async function main() {
  const { data: cfg } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').maybeSingle()
  const key = cfg?.value || process.env.OPENAI_API_KEY
  if (!key) { console.log('No OpenAI key configured.'); return }

  // already-cached "hash|lang"
  const cached = new Set()
  for (let o = 0; o < 300000; o += 1000) {
    const { data } = await sb.from('content_translations').select('source_hash, target_lang').order('id').range(o, o + 999)
    if (!data || !data.length) break
    for (const r of data) cached.add(r.source_hash + '|' + r.target_lang)
    if (data.length < 1000) break
  }

  // unique texts from product name + description
  const { count: total } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true)
  const texts = new Map() // hash -> text
  for (let o = 0; o < total + 1000; o += 1000) {
    const { data } = await sb.from('products').select('name, description').eq('is_published', true).order('id').range(o, o + 999)
    if (!data || !data.length) break
    for (const p of data) for (const t of [p.name, p.description]) { const c = (t ?? '').trim(); if (c) texts.set(sha(c), c) }
    if (data.length < 1000) break
  }

  // build job list (text, lang) for everything not yet cached
  const jobs = []
  for (const [hash, text] of texts) for (const lang of Object.keys(TARGETS)) if (!cached.has(hash + '|' + lang)) jobs.push({ hash, text, lang })
  console.log(`Unique texts: ${texts.size} · jobs to translate: ${jobs.length} (${Object.keys(TARGETS).length} langs)`)

  let done = 0, failed = 0, i = 0
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++]
      try {
        const out = await translate(job.text, TARGETS[job.lang], key)
        if (out && out !== job.text) {
          await sb.from('content_translations').upsert({ source_hash: job.hash, target_lang: job.lang, translated: out }, { onConflict: 'source_hash,target_lang' })
        }
        done++
      } catch { failed++ }
      if ((done + failed) % 500 === 0) console.log(`  …${done + failed}/${jobs.length} (${done} ok, ${failed} failed)`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`DONE — translated ${done}, failed ${failed}.`)
}
main().catch(e => console.log('ERR', e.message))
