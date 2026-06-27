require('dotenv').config({ path: '.env.local' })
const crypto = require('crypto'), fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sha = (s) => crypto.createHash('sha256').update(String(s).trim()).digest('hex')
const TARGETS = (process.env.LANGS || 'es').split(',')

// Args: FIELD=name|description  LIMIT=40  OUT=path
const FIELD = process.env.FIELD || 'name'
const LIMIT = parseInt(process.env.LIMIT || '40')
const OUT = process.env.OUT || 'C:/Users/anike/AppData/Local/Temp/claude/tx-batch.json'

async function main() {
  const cached = new Set()
  for (let o = 0; o < 300000; o += 1000) {
    const { data } = await sb.from('content_translations').select('source_hash, target_lang').order('id').range(o, o + 999)
    if (!data || !data.length) break
    for (const r of data) cached.add(r.source_hash + '|' + r.target_lang)
    if (data.length < 1000) break
  }
  const { count: total } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true)
  const seen = new Set(); const batch = []
  for (let o = 0; o < total + 1000 && batch.length < LIMIT; o += 1000) {
    const { data } = await sb.from('products').select(FIELD).eq('is_published', true).order('id').range(o, o + 999)
    if (!data || !data.length) break
    for (const p of data) {
      const text = (p[FIELD] ?? '').trim()
      if (!text) continue
      const h = sha(text)
      if (seen.has(h)) continue; seen.add(h)
      const missing = TARGETS.filter((l) => !cached.has(h + '|' + l))
      if (missing.length) { batch.push({ hash: h, text, langs: missing }); if (batch.length >= LIMIT) break }
    }
    if (data.length < 1000) break
  }
  fs.writeFileSync(OUT, JSON.stringify(batch, null, 1))
  // remaining count for this field
  let remaining = 0; const seen2 = new Set()
  for (let o = 0; o < total + 1000; o += 1000) {
    const { data } = await sb.from('products').select(FIELD).eq('is_published', true).order('id').range(o, o + 999)
    if (!data || !data.length) break
    for (const p of data) { const t = (p[FIELD] ?? '').trim(); if (!t) continue; const h = sha(t); if (seen2.has(h)) continue; seen2.add(h); if (TARGETS.some((l) => !cached.has(h + '|' + l))) remaining++ }
    if (data.length < 1000) break
  }
  console.log(`Exported ${batch.length} ${FIELD}(s) → ${OUT} · ${remaining} unique ${FIELD}s still need translation`)
}
main().catch(e => console.log('ERR', e.message))
