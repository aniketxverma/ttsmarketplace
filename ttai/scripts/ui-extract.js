require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sha = (s) => crypto.createHash('sha256').update(String(s).trim()).digest('hex')

const exts = ['.tsx', '.ts']
const files = []
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (exts.includes(path.extname(e.name))) files.push(p)
  }
}
walk('app'); walk('components')

const strs = new Set()
const quoted = (block) => {
  for (const m of block.matchAll(/'((?:[^'\\]|\\.)*)'/g)) strs.add(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'))
  for (const m of block.matchAll(/"((?:[^"\\]|\\.)*)"/g)) strs.add(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
}
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8')
  // tt('literal')
  for (const m of s.matchAll(/\btt\(\s*'((?:[^'\\]|\\.)*)'/g)) strs.add(m[1].replace(/\\'/g, "'"))
  for (const m of s.matchAll(/\btt\(\s*"((?:[^"\\]|\\.)*)"/g)) strs.add(m[1].replace(/\\"/g, '"'))
  // localizeUI([ ... ]) arrays — extract every quoted string inside
  for (const m of s.matchAll(/localizeUI\(\s*\[([\s\S]*?)\]/g)) quoted(m[1])
}

async function main() {
  const es = new Set()
  for (let o = 0; o < 300000; o += 1000) {
    const { data } = await sb.from('content_translations').select('source_hash').eq('target_lang', 'es').order('id').range(o, o + 999)
    if (!data || !data.length) break
    data.forEach((r) => es.add(r.source_hash))
    if (data.length < 1000) break
  }
  const all = [...strs].filter(Boolean)
  const missing = all.filter((t) => !es.has(sha(t.trim())))
  console.log('Total tt() UI strings:', all.length, '| missing in es:', missing.length)
  fs.writeFileSync(process.env.OUT || 'C:/Users/anike/AppData/Local/Temp/claude/ui-missing.json', JSON.stringify(missing, null, 1))
  missing.forEach((s) => console.log('  ✗ ' + s.slice(0, 80)))
}
main().catch((e) => console.log('ERR', e.message))
