require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const crypto = require('crypto')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Pre-fills content_translations so the site's localizeNames() (cache-read) shows
// translated category & product names instantly. Uses the admin OpenAI key.
//   node scripts/translate-content.js categories
//   node scripts/translate-content.js products
//   node scripts/translate-content.js all
const LANGS = { es: 'Spanish', ar: 'Arabic', fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian', fa: 'Persian (Farsi)' }
const sha = (s) => crypto.createHash('sha256').update(String(s).trim()).digest('hex')
const BATCH = 25

async function getOpenAI() {
  const { data } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  return new OpenAI({ apiKey: data.value })
}

async function translateBatch(openai, texts, langName) {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini', temperature: 0,
    messages: [
      { role: 'system', content: `You are a professional B2B e-commerce translator. Translate each item in the JSON array into ${langName}. Keep brand names, model numbers, units and codes unchanged. Return ONLY a JSON array of the same length, same order, no keys.` },
      { role: 'user', content: JSON.stringify(texts) },
    ],
  })
  let out = r.choices[0].message.content.trim().replace(/^```json\s*|\s*```$/g, '')
  try { const arr = JSON.parse(out); if (Array.isArray(arr) && arr.length === texts.length) return arr } catch {}
  return null
}

// Static UI strings (footer + shared chrome). Extend as more pages are wired to localizeUI.
const UI_STRINGS = [
  // Footer
  'Departments', 'Shop', 'Platform', 'Suppliers', 'Company',
  'Marketplace', 'Opportunities', 'Logistics Hub', 'Business Consulting', 'Contact a Team',
  'Retail Store', 'Business Shop', 'Outlet Zone', 'Trade Hub', 'Channels',
  'Regions', 'Pricing', 'Join as Supplier', 'Supplier Login', 'Verification', 'Become a Seller',
  'About Us', 'Contact', 'Privacy Policy', 'Terms of Service',
  'The global B2B marketplace connecting factories, suppliers, distributors and retailers across Europe, the Middle East, and Africa.',
  'ISO Verified', 'Secure Payments', 'GDPR Compliant',
  'Stay updated on trade opportunities', 'Get weekly curated supplier news and marketplace updates.',
  'Subscribe', 'Trusted global commerce', 'Privacy', 'Terms', 'All systems operational',
]

async function uniqueNames(kind) {
  if (kind === 'ui') return UI_STRINGS
  const names = new Set()
  if (kind === 'categories') {
    const { data } = await sb.from('categories').select('name').limit(2000)
    for (const c of (data || [])) if (c.name) names.add(c.name.trim())
  } else {
    let from = 0
    for (;;) {
      const { data } = await sb.from('products').select('name').eq('is_published', true).range(from, from + 999)
      if (!data || !data.length) break
      for (const p of data) if (p.name) names.add(p.name.trim())
      if (data.length < 1000) break
      from += 1000
    }
  }
  return Array.from(names).filter(Boolean)
}

async function run(kind) {
  const openai = await getOpenAI()
  const names = await uniqueNames(kind)
  console.log(`${kind}: ${names.length} unique names × ${Object.keys(LANGS).length} languages`)

  for (const [lang, langName] of Object.entries(LANGS)) {
    // which are already cached?
    const cached = new Set()
    const allHashes = names.map(sha)
    for (let i = 0; i < allHashes.length; i += 300) {
      const { data } = await sb.from('content_translations').select('source_hash').eq('target_lang', lang).in('source_hash', allHashes.slice(i, i + 300))
      for (const r of (data || [])) cached.add(r.source_hash)
    }
    const todo = names.filter((n) => !cached.has(sha(n)))
    if (!todo.length) { console.log(`  ${lang}: all cached ✓`); continue }
    let done = 0
    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH)
      const translated = await translateBatch(openai, chunk, langName)
      if (!translated) { console.log(`  ${lang}: batch @${i} failed, skipping`); continue }
      const rows = chunk.map((n, j) => ({ source_hash: sha(n), target_lang: lang, translated: translated[j] }))
        .filter((r) => r.translated && r.translated !== names.find((n) => sha(n) === r.source_hash))
      if (rows.length) await sb.from('content_translations').upsert(rows, { onConflict: 'source_hash,target_lang' })
      done += chunk.length
      process.stdout.write(`\r  ${lang}: ${done}/${todo.length}   `)
    }
    console.log(`\r  ${lang}: ${todo.length} translated ✓        `)
  }
}

async function main() {
  const kind = process.argv[2] || 'categories'
  if (kind === 'all') { await run('categories'); await run('products') }
  else await run(kind)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
