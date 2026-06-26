require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const CN = '15cd22f3-460b-437f-b3a0-16d5eac65aa6'
const CAT = '6c8be190-b0dc-4907-870a-e6f190ac2a81'
const FILE = 'C:/Users/anike/Downloads/OSCAL Catalogue June 2026-Alice.xls'
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)

async function ensureSupplier(row) {
  let { data: sup } = await sb.from('suppliers').select('id').eq('brand_slug', row.brand_slug).maybeSingle()
  if (!sup) {
    let ins = await sb.from('suppliers').insert(row).select('id').single()
    if (ins.error) { const r = { ...row }; delete r.badges; ins = await sb.from('suppliers').insert(r).select('id').single() }
    if (ins.error) { console.log('supplier err', ins.error.message); process.exit(1) }
    sup = ins.data; console.log(row.trade_name, 'CREATED', sup.id)
  } else console.log(row.trade_name, 'exists', sup.id)
  return sup.id
}

async function insertProduct(row) {
  let ins = await sb.from('products').insert(row).select('id').single()
  if (ins.error && /column|does not exist/i.test(ins.error.message)) {
    const o = { ...row };['product_line', 'ean', 'units_per_carton', 'net_content', 'price_on_request', 'specs', 'lead_time', 'brand_name'].forEach((k) => delete o[k])
    ins = await sb.from('products').insert(o).select('id').single()
  }
  if (ins.error) { console.log('  err', row.name, ins.error.message); return null }
  return ins.data.id
}

async function main() {
  const SUP = await ensureSupplier({
    legal_name: 'DOKE Communication HK Co., Ltd', trade_name: 'OSCAL', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'wholesale', country_id: CN, tax_id: 'HK-OSCAL', brand_slug: 'oscal', reliability_tier: 'SILVER',
    business_email: 'alice@oscal.hk', whatsapp: '8618589070817', website: 'https://www.oscal.hk', phone: '+86 185 8907 0817',
    tagline: 'OSCAL — rugged phones, tablets & smart devices (Made in China)',
    about_company: 'OSCAL (DOKE Communication HK Co., Ltd) — manufacturer of rugged smartphones, tablets, kids tablets, smartwatches and accessories. Wholesale FCA Hong Kong (USD). Payment: 100% TT before shipping. Warranty: 1 year. Contact: alice@oscal.hk.',
    description: 'OSCAL rugged phones, tablets & accessories — wholesale FCA Hong Kong.',
    badges: ['China Supplier', 'Electronics', 'Rugged Phones & Tablets', 'Wholesale'],
  })

  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets['OSCAL Product Price list'], { header: 1, defval: '' })
  let section = '', model = '', spec = '', colors = '', ok = 0
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i]
    const type = clean(r[0]); const m = clean(r[1]); const sp = clean(r[3])
    const mem = clean(r[4]); const price = parseFloat(r[5]); const color = clean(r[6])
    // Section header rows (Type only, no model/price)
    if (type && !m && !mem && r[5] === '') {
      if (/tablet|rugged|smartphone|accessor/i.test(type)) section = type.replace(/series/i, '').trim()
      continue
    }
    if (type === 'Type' || m === 'Model') continue
    if (m) { model = m.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(); if (sp) spec = sp; if (color) colors = color }
    // A product row = has a price (or is a no-price "coming soon" model row → price on request)
    const hasPrice = !isNaN(price) && price > 0
    const isComingSoon = m && !hasPrice && /coming soon/i.test(model)
    if (!hasPrice && !isComingSoon) continue

    const memTag = mem && mem !== '/' ? ` ${mem}` : ''
    const name = `OSCAL ${model}${memTag}`.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
    const id = await insertProduct({
      supplier_id: SUP, category_id: CAT, marketplace_context: 'wholesale',
      name: name.slice(0, 140), slug: slugify(name) + '-' + Math.random().toString(36).slice(2, 6),
      brand_name: 'OSCAL', product_line: section || 'OSCAL',
      net_content: mem && mem !== '/' ? `${mem} GB` : null,
      description: `${spec}\n\n${mem && mem !== '/' ? `Memory: ${mem}\n` : ''}${colors ? `Colors: ${colors}\n` : ''}FCA Hong Kong (USD). Payment: 100% TT before shipping. Warranty: 1 year.`.trim(),
      specs: { Brand: 'OSCAL', Series: section, Memory: mem || '', Colors: colors || '', Incoterm: 'FCA Hong Kong', Payment: '100% TT before shipping', Warranty: '1 year' },
      price_cents: hasPrice ? Math.round(price * 100) : 0, price_on_request: !hasPrice, currency_code: 'USD',
      retail_price_cents: null,
      sell_piece: true, sell_box: false, sell_pallet: false, sell_truck: false,
      min_order_qty: 1, stock_qty: 200, is_published: true, country_of_origin: 'China', lead_time: 'FCA Hong Kong',
    })
    if (id) ok++
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`OSCAL: ${count} products (inserted ${ok})`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
