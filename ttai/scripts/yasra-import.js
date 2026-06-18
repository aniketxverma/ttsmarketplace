require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const ES = 'b8b14802-20f2-4292-86cc-a34198b39384'
const CAT = '8874edac-8c8a-49a4-8212-c183db043feb' // elec-smartphones
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

// Models confirmed by the supplier — PRICES ON REQUEST (ask / WhatsApp). brand, name, storage.
const PRODUCTS = [
  ['Apple', 'iPhone 17 Pro Max', '256GB'],
  ['Apple', 'iPhone 17 Pro', '256GB'],
  ['Apple', 'iPhone 16 Pro Max', '256GB'],
  ['Samsung', 'Samsung Galaxy A57', '8GB / 256GB'],
  ['Samsung', 'Samsung Galaxy A56', '8GB / 256GB'],
  ['Samsung', 'Samsung Galaxy A37', '8GB / 256GB'],
  ['Samsung', 'Samsung Galaxy S25 FE', '128GB'],
  ['Samsung', 'Samsung Galaxy A17', '8GB / 256GB'],
  ['Samsung', 'Samsung Galaxy A17', '4GB / 128GB'],
  ['Samsung', 'Samsung Galaxy A16', '4GB / 128GB'],
  ['Samsung', 'Samsung Galaxy A07 (A075)', '64GB'],
  ['Samsung', 'Samsung Galaxy A07 (A075)', '128GB'],
  ['Samsung', 'Samsung Galaxy A06 (A065)', '128GB'],
  ['Samsung', 'Samsung Galaxy A03s', '64GB'],
  ['Samsung', 'Samsung Galaxy M02', '64GB'],
  ['Redmi', 'Redmi A5', '128GB'],
  ['Redmi', 'Redmi A7 Pro', '128GB'],
  ['Redmi', 'Redmi Note 14', '256GB'],
  ['Redmi', 'Redmi 15', '256GB'],
  ['Redmi', 'Redmi 15C', '128GB'],
  ['Redmi', 'Redmi 14C', '128GB'],
  ['Redmi', 'Redmi Note 13', '128GB'],
  ['Redmi', 'Redmi 12', '128GB'],
  ['KXD', 'KXD Pro', '64GB'],
]

async function main() {
  // City Melilla
  let { data: city } = await sb.from('cities').select('id').eq('country_id', ES).ilike('name', 'Melilla').maybeSingle()
  if (!city) { const ins = await sb.from('cities').insert({ country_id: ES, name: 'Melilla', slug: 'melilla' }).select('id').single(); city = ins.data }

  // Supplier
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%YASRA TELECOM%').maybeSingle()
  const supRow = {
    legal_name: 'YASRA TELECOM SLU', trade_name: 'Yasra Telecom', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: ES, city_id: city?.id ?? null, tax_id: 'B52020807', brand_slug: 'yasra-telecom',
    reliability_tier: 'GOLD', founded_year: 2009, years_experience: 17, countries_served: 5,
    whatsapp: '+34619970803', phone: '+34619970803', website: 'https://www.yasratelecom.es',
    address_line1: 'Calle Zamora, 21', postal_code: '52006',
    tagline: 'Mobile phones, smartphones & electronics — retail & wholesale',
    about_company: 'YASRA TELECOM SLU is a Spanish telecommunications and consumer electronics company established in 2009 in Melilla. We specialize in the retail and wholesale distribution of mobile phones, smartphones, tablets, accessories and telecom equipment, plus repair and technical services. With more than 17 years of experience we serve customers across Spain and Europe, now expanding through TTAI EMA.',
    description: 'Mobile phones & electronics — retail & wholesale. Ready to ship from Melilla, Spain.',
    badges: ['Verified Company', 'Spain Supplier', 'Ready to Ship', 'Retail & Wholesale'],
  }
  if (!sup) {
    let ins = await sb.from('suppliers').insert(supRow).select('id').single()
    if (ins.error) { delete supRow.badges; ins = await sb.from('suppliers').insert(supRow).select('id').single() }
    sup = ins.data; console.log('supplier created')
  } else {
    const upd = { ...supRow }; delete upd.legal_name
    await sb.from('suppliers').update(upd).eq('id', sup.id).then(({ error }) => { if (error) { delete upd.badges; return sb.from('suppliers').update(upd).eq('id', sup.id) } })
    console.log('supplier updated')
  }
  const SUP = sup.id

  // Products — all price on request
  const items = PRODUCTS.map(([brand, name, storage]) => {
    const full = `${name} ${storage}`.replace(/\s+/g, ' ').trim()
    return {
      supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
      name: full.slice(0, 140), slug: slugify(full) + '-' + Math.random().toString(36).slice(2, 6),
      brand_name: brand, model_name: name, net_content: storage,
      description: `Brand new ${full}. Retail & wholesale — price on request.\nMOQ: 20 pcs per model (1 carton). Ready to Ship from Melilla, Spain.`,
      price_cents: 0, price_on_request: true, currency_code: 'EUR',
      min_order_qty: 1, units_per_carton: 20, min_box_qty: 1, stock_qty: 200,
      sell_piece: true, sell_box: true, lead_time: 'Ready to Ship · 1–2 days',
      is_published: true, country_of_origin: 'EU',
    }
  })
  // Insert (defensive: drop optional cols if a column is missing)
  let ok = 0
  for (const it of items) {
    let ins = await sb.from('products').insert(it).select('id').single()
    if (ins.error && /column|does not exist/i.test(ins.error.message)) {
      const o = { ...it }; ['model_name', 'net_content', 'units_per_carton', 'min_box_qty', 'sell_piece', 'sell_box', 'lead_time', 'price_on_request'].forEach(k => delete o[k])
      ins = await sb.from('products').insert(o).select('id').single()
    }
    if (ins.error) { console.log('err', it.name, ins.error.message); continue }
    ok++
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('INSERTED:', ok, '| Yasra total products:', count)
}
main().catch((e) => console.log('ERR', e.message))
