require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const FILE = 'C:/Users/anike/Downloads/ELIT COOLING 06-2026 export ES.xlsx'
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const numify = (v) => { const n = parseFloat(String(v).replace(/[^0-9.,]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n }

async function main() {
  // Country (Spain — "export ES")
  const { data: es } = await sb.from('countries').select('id').eq('iso_code', 'ES').maybeSingle()
  // Root category Electronics & Technology + a "Fans & Cooling" sub-category
  const { data: root } = await sb.from('categories').select('id').eq('slug', 'electronics-technology').maybeSingle()
  let catId = null
  if (root) {
    const { data: ex } = await sb.from('categories').select('id').eq('slug', 'cooling-fans').maybeSingle()
    if (ex) catId = ex.id
    else {
      const { data } = await sb.from('categories').insert({ name: 'Fans & Cooling', slug: 'cooling-fans', parent_id: root.id, sort_order: 20, status: 'active' }).select('id').single()
      catId = data?.id
    }
  }

  // Supplier
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%Elit Cooling%').maybeSingle()
  if (!sup) {
    const ins = await sb.from('suppliers').insert({
      legal_name: 'Elit Cooling', trade_name: 'Elit Cooling', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
      marketplace_context: 'both', country_id: es?.id ?? null, tax_id: 'ES-ELIT', brand_slug: 'elit-cooling',
      reliability_tier: 'SILVER', tagline: 'Fans, mist coolers & cooling appliances',
    }).select('id').single()
    sup = ins.data
    console.log('supplier created')
  } else console.log('supplier exists')
  const SUP = sup.id

  // Parse
  const wb = XLSX.readFile(FILE)
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Cooling 2026'], { header: 1, defval: '' })
  let section = ''
  const items = []
  const seen = new Set()
  for (const r of rows) {
    const code = norm(r[0]), model = norm(r[1]), ean = norm(r[2]), sec = norm(r[3])
    const spec = norm(r[4]), photo = norm(r[5]), price = numify(r[7]), rrp = numify(r[8]), stock = parseInt(numify(r[9]))
    if (!code && !model && sec) { section = sec; continue }                 // section header
    if (code === 'CODE' || model === 'MODEL') continue                       // header row
    if (!model || price <= 0) continue                                       // not a product
    const key = ean || (code + model); if (seen.has(key)) continue; seen.add(key)
    const exw = Math.round(price * 100)
    items.push({
      supplier_id: SUP, category_id: catId, marketplace_context: 'both',
      name: model.slice(0, 140), slug: slugify(model) + '-' + (ean ? ean.slice(-5) : code),
      brand_name: 'Elit', sku: code || null, model_name: photo || null, ean: ean ? ean.slice(0, 40) : null,
      description: spec || null, price_cents: Math.round(exw * 1.03), exw_price_cents: exw,
      retail_price_cents: rrp > 0 ? Math.round(rrp * 100) : null, currency_code: 'EUR',
      min_order_qty: 1, stock_qty: stock || 0, is_published: true, country_of_origin: 'Turkey',
      product_line: section ? `Elit ${section.replace(/s$/, '').replace(/^\w/, (c) => c)}` : null,
    })
  }
  console.log('parsed products:', items.length)

  let ok = 0
  for (let i = 0; i < items.length; i += 100) {
    const { error } = await sb.from('products').insert(items.slice(i, i + 100))
    if (error) { console.log('batch err @' + i, error.message); break }
    ok += Math.min(100, items.length - i)
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('INSERTED:', ok, '| Elit Cooling total products:', count)
}
main().catch((e) => console.log('ERR', e.message))
