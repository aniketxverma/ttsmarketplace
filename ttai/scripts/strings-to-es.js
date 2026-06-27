// Translate a list of English UI strings to Spanish via the admin OpenAI key and
// insert them as top-level keys in lib/i18n/messages/es.ts (for client useT()).
// Skips strings already present as a key. Usage: LIST=file.json node scripts/strings-to-es.js
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ES = 'ttai/lib/i18n/messages/es.ts'.replace('ttai/', '')

async function main() {
  const lines = fs.readFileSync(process.env.LIST, 'utf8').split('\n').filter(Boolean)
  const all = [...new Set(lines.map((l) => JSON.parse(l)))]
  let es = fs.readFileSync('lib/i18n/messages/es.ts', 'utf8')
  // Skip strings that already exist as a top-level key (either quote style).
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const need = all.filter((s) => !new RegExp(`['"]${esc(s)}['"]\\s*:`).test(es))
  console.log(`${all.length} strings, ${need.length} new (rest already keyed)`)
  if (!need.length) return

  const { data: cfg } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').maybeSingle()
  const key = cfg?.value || process.env.OPENAI_API_KEY
  const trans = []
  for (let i = 0; i < need.length; i += 50) {
    const batch = need.slice(i, i + 50)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0, messages: [
        { role: 'system', content: 'Translate each item of the JSON array into Spanish (Spain). Keep brand names, codes and units unchanged. Return ONLY a JSON array of the same length and order.' },
        { role: 'user', content: JSON.stringify(batch) },
      ] }),
    })
    if (!res.ok) { console.log('API error', res.status, (await res.text()).slice(0, 200)); return }
    const out = (await res.json()).choices[0].message.content.trim().replace(/^```json\s*|\s*```$/g, '')
    JSON.parse(out).forEach((v) => trans.push(v))
    process.stdout.write(`  translated ${Math.min(i + 50, need.length)}/${need.length}\n`)
  }
  const entries = need.map((en, i) => `  ${JSON.stringify(en)}: ${JSON.stringify(trans[i])},`).join('\n')
  es = es.replace(/export default \{\n/, `export default {\n${entries}\n`)
  fs.writeFileSync('lib/i18n/messages/es.ts', es)
  console.log(`Inserted ${need.length} keys into es.ts`)
}
main().catch((e) => console.log('ERR', e.message))
