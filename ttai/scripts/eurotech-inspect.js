require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data: sup } = await sb.from('suppliers').select('id,trade_name').ilike('legal_name', '%EuroTech%').maybeSingle()
  if (!sup) { console.log('no EuroTech'); return }
  console.log('supplier', sup.id, sup.trade_name)
  const { count: total } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', sup.id)
  console.log('total products', total)

  const { data: prods } = await sb.from('products').select('id,name,brand_name,categories(name,slug)').eq('supplier_id', sup.id).limit(8)
  for (const p of prods) {
    const { count: imgc } = await sb.from('product_images').select('*', { count: 'exact', head: true }).eq('product_id', p.id)
    console.log('imgs=' + imgc, '|', (p.categories && p.categories.slug) || '?', '|', p.brand_name || '-', '|', p.name.slice(0, 55))
  }

  // full category breakdown (paginate)
  const by = {}
  let from = 0
  for (;;) {
    const { data } = await sb.from('products').select('categories(slug)').eq('supplier_id', sup.id).range(from, from + 999)
    if (!data || !data.length) break
    for (const p of data) { const k = (p.categories && p.categories.slug) || 'none'; by[k] = (by[k] || 0) + 1 }
    if (data.length < 1000) break
    from += 1000
  }
  console.log('by category:', JSON.stringify(by, null, 0))

  // how many products total have zero images?
  const { data: imgRows } = await sb.from('product_images').select('product_id').limit(1) // sanity
  console.log('product_images table reachable:', Array.isArray(imgRows))
}
main().catch((e) => console.log('ERR', e.message))
