// Extract a page's user-visible strings (data arrays + tt literals) and report
// which are NOT cached in the target language (so they render English).
require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sha = (s) => crypto.createHash('sha256').update(String(s).trim()).digest('hex')
const FILE = process.env.FILE || 'app/(public)/page.tsx'
const LANG = process.env.LANG || 'es'
const OUT = process.env.OUT || 'C:/Users/anike/AppData/Local/Temp/claude/page-missing.json'

const s = fs.readFileSync(FILE, 'utf8')
const vals = new Set()
for (const q of s.matchAll(/\b(?:title|sub|desc|label|t|name|cta|badge|tag|sub2|heading|placeholder):\s*'((?:[^'\\]|\\.)*)'/g)) vals.add(q[1].replace(/\\'/g, "'"))
for (const q of s.matchAll(/\btt\(\s*'((?:[^'\\]|\\.)*)'/g)) vals.add(q[1].replace(/\\'/g, "'"))

async function main() {
  const es = new Set()
  for (let o = 0; o < 300000; o += 1000) {
    const { data } = await sb.from('content_translations').select('source_hash').eq('target_lang', LANG).order('id').range(o, o + 999)
    if (!data || !data.length) break
    data.forEach((r) => es.add(r.source_hash)); if (data.length < 1000) break
  }
  const all = [...vals].filter(Boolean)
  const missing = all.filter((t) => !es.has(sha(t)))
  console.log(FILE, '| visible strings:', all.length, '| missing in ' + LANG + ':', missing.length)
  fs.writeFileSync(OUT, JSON.stringify(missing, null, 1))
  missing.forEach((v) => console.log('  ✗ ' + v))
}
main().catch((e) => console.log('ERR', e.message))
