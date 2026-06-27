require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Join a tx-export batch (BATCH, has hashes) with an index-aligned array of
// translated strings (OUT), and upsert for LANG (default es).
const BATCH = process.env.BATCH, OUT = process.env.OUT, LANG = process.env.LANG || 'es'

async function main() {
  const batch = JSON.parse(fs.readFileSync(BATCH, 'utf8'))
  const out = JSON.parse(fs.readFileSync(OUT, 'utf8'))
  if (batch.length !== out.length) { console.log(`LENGTH MISMATCH: batch ${batch.length} vs out ${out.length}`); return }
  const rows = batch.map((b, i) => ({ source_hash: b.hash, target_lang: LANG, translated: out[i] }))
    .filter((r) => typeof r.translated === 'string' && r.translated.trim())
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('content_translations').upsert(rows.slice(i, i + 200), { onConflict: 'source_hash,target_lang' })
    if (error) { console.log('err', error.message); return }
  }
  console.log(`Imported ${rows.length} ${LANG} translations (my own).`)
}
main().catch(e => console.log('ERR', e.message))
