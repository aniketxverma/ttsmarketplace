// Translate a given list of UI strings into Spanish via the admin OpenAI key and
// cache them in content_translations. Usage: node scripts/warm-list.js "A" "B" ...
require('dotenv').config({ path: '.env.local' })
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sha = (s) => crypto.createHash('sha256').update(String(s).trim()).digest('hex')
const LANG = process.env.LANG || 'es'
const LANG_NAME = { es: 'Spanish', ar: 'Arabic', fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian', fa: 'Persian (Farsi)' }[LANG] || 'Spanish'

async function main() {
  const file = process.env.LIST
  const texts = file ? JSON.parse(require('fs').readFileSync(file, 'utf8')) : process.argv.slice(2)
  const { data: cfg } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').maybeSingle()
  const key = cfg?.value || process.env.OPENAI_API_KEY
  // skip already cached
  const need = []
  for (const t of texts) {
    const { data } = await sb.from('content_translations').select('id').eq('target_lang', LANG).eq('source_hash', sha(t)).maybeSingle()
    if (!data) need.push(t)
  }
  if (!need.length) { console.log('all', texts.length, 'already cached'); return }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0, messages: [
      { role: 'system', content: `Translate each item of the JSON array into ${LANG_NAME}. Keep brand names, codes and units unchanged. Return ONLY a JSON array of the same length and order.` },
      { role: 'user', content: JSON.stringify(need) },
    ] }),
  })
  if (!res.ok) { console.log('API error', res.status, (await res.text()).slice(0, 200)); return }
  const out = (await res.json()).choices[0].message.content.trim().replace(/^```json\s*|\s*```$/g, '')
  const arr = JSON.parse(out)
  const rows = need.map((t, i) => ({ source_hash: sha(t), target_lang: LANG, translated: arr[i] })).filter(r => r.translated)
  await sb.from('content_translations').upsert(rows, { onConflict: 'source_hash,target_lang' })
  console.log(`Cached ${rows.length} ${LANG} translations (${texts.length - need.length} were already done).`)
  rows.forEach(r => console.log('  ', need[rows.indexOf(r)], '→', r.translated))
}
main().catch(e => console.log('ERR', e.message))
