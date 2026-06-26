require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = 'ba9c388a-735b-4e15-a36a-4f19d02db2dc' // Sytech Madrid
const KEEP = 4
const APPLY = process.env.APPLY === '1'

async function main() {
  const { data: ps } = await sb.from('products').select('id, name, sku, product_line').eq('supplier_id', SUP)
  // image counts
  const withImg = new Set()
  const { data: imgs } = await sb.from('product_images').select('product_id').in('product_id', ps.map(p => p.id))
  for (const r of imgs || []) withImg.add(r.product_id)

  const byLine = {}
  for (const p of ps) (byLine[p.product_line || '(none)'] ||= []).push(p)

  const keepIds = new Set()
  for (const [, list] of Object.entries(byLine)) {
    // prefer products that already have an image, then alphabetical by sku
    list.sort((a, b) => (Number(withImg.has(b.id)) - Number(withImg.has(a.id))) || String(a.sku).localeCompare(String(b.sku)))
    list.slice(0, KEEP).forEach(p => keepIds.add(p.id))
  }
  const deleteIds = ps.filter(p => !keepIds.has(p.id)).map(p => p.id)
  console.log(`Sytech: ${ps.length} products → keep ${keepIds.size}, delete ${deleteIds.length}`)

  if (!APPLY) { console.log('DRY RUN — re-run with APPLY=1 to delete.'); return }
  for (let i = 0; i < deleteIds.length; i += 100) {
    const batch = deleteIds.slice(i, i + 100)
    await sb.from('product_images').delete().in('product_id', batch)
    const { error } = await sb.from('products').delete().in('id', batch)
    if (error) { console.log('  delete err:', error.message); break }
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`Done — Sytech now has ${count} products (4 per category).`)
}
main().catch(e => console.log('ERR', e.message))
