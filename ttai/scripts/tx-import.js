require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Reads a results file: [{ hash, lang, translated }, ...] and upserts each.
const IN = process.env.IN || 'C:/Users/anike/AppData/Local/Temp/claude/tx-results.json'

async function main() {
  const rows = JSON.parse(fs.readFileSync(IN, 'utf8'))
    .filter((r) => r.hash && r.lang && typeof r.translated === 'string' && r.translated.trim())
    .map((r) => ({ source_hash: r.hash, target_lang: r.lang, translated: r.translated }))
  let ok = 0
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('content_translations').upsert(rows.slice(i, i + 200), { onConflict: 'source_hash,target_lang' })
    if (error) { console.log('err:', error.message); break }
    ok += rows.slice(i, i + 200).length
  }
  console.log(`Imported ${ok} translations.`)
}
main().catch(e => console.log('ERR', e.message))
