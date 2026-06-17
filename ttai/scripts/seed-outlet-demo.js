require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)

// Demo outlet lots per supplier (clearly prefixed "DEMO ·" so they're easy to find/remove).
const PLAN = {
  EuroTech:   { role: 'distributor', lots: [
    ['DEMO · Mixed Electronics Customer Returns', 'return_b', 'pallet', 'Amazon Returns', 18000],
    ['DEMO · Smartphone Overstock Lot', 'overstock', 'box', 'Overstock', 9500],
    ['DEMO · TV & Multimedia Clearance Truckload', 'clearance', 'truck', 'MediaMarkt Returns', 145000],
  ]},
  XO:         { role: 'distributor', lots: [
    ['DEMO · Mobile Accessories Mixed Pallet', 'mixed', 'pallet', 'Overstock', 6500],
    ['DEMO · Earbuds Customer Returns Grade A', 'return_a', 'box', 'Amazon Returns', 4200],
  ]},
  Createl:    { role: 'direct_supplier', lots: [
    ['DEMO · JBL Audio End-of-Line Clearance', 'clearance', 'pallet', 'End of Line', 12000],
    ['DEMO · Headphones Returns Grade A', 'return_a', 'box', 'Carrefour Clearance', 3800],
  ]},
  Viscosity:  { role: 'direct_supplier', lots: [
    ['DEMO · Motor Oil Overstock Pallet', 'overstock', 'pallet', 'Overstock', 8800],
    ['DEMO · Lubricants Clearance Truckload', 'clearance', 'truck', 'End of Line', 96000],
  ]},
  Rozil:      { role: 'direct_supplier', lots: [
    ['DEMO · Detergent Clearance Pallet', 'clearance', 'pallet', 'Lidl Overstock', 5400],
    ['DEMO · Cleaning Products Mixed Pallet', 'mixed', 'pallet', 'Overstock', 4600],
  ]},
  Chtaura:    { role: 'direct_supplier', lots: [
    ['DEMO · Canned Food Overstock Pallet', 'overstock', 'pallet', 'Overstock', 7200],
    ['DEMO · Olive Oil Clearance Box', 'clearance', 'box', 'End of Line', 2600],
  ]},
  iPhone:     { role: 'direct_supplier', lots: [
    ['DEMO · iPhone Refurbished Grade A', 'refurbished', 'box', 'Refurbished', 28000],
    ['DEMO · iPhone Cosmetic Defect Lot', 'cosmetic_defect', 'box', 'Customer Returns', 16000],
  ]},
}

const OPPS = [
  { who: 'Chtaura', role: 'factory', looking: 'distributor', title: 'Chtaura looking for distributors in Spain, Portugal & Africa', cat: 'Food & Beverage', country: 'Spain, Portugal, Africa', aud: ['supplier', 'distributor'] },
  { who: 'Rozil', role: 'supplier', looking: 'distributor', title: 'Rozil looking for distributors in Europe + local clients', cat: 'Cleaning Products', country: 'Europe', aud: ['distributor', 'retail'] },
  { who: 'EuroTech', role: 'distributor', looking: 'retail', kind: 'promotion', title: 'Promo: Electronics returns pallets — 20% off this week', cat: 'Electronics', country: 'Italy, EU', aud: ['retail'] },
  { who: 'Viscosity', role: 'factory', looking: 'importer', title: 'Viscosity seeking importers for motor oil — MENA region', cat: 'Automotive', country: 'UAE, Saudi Arabia, Morocco', aud: ['supplier', 'distributor'] },
]

async function getSup(name) {
  const { data } = await sb.from('suppliers').select('id, trade_name, legal_name, owner_id, country_id, countries(name)').or(`trade_name.ilike.%${name}%,legal_name.ilike.%${name}%`).limit(1).maybeSingle()
  return data
}

async function main() {
  let lotCount = 0
  for (const [name, cfg] of Object.entries(PLAN)) {
    const sup = await getSup(name)
    if (!sup) { console.log('skip (no supplier):', name); continue }
    await sb.from('suppliers').update({ outlet_role: cfg.role }).eq('id', sup.id)

    // sample a category + a few image URLs from this supplier's real products
    const { data: prods } = await sb.from('products').select('id, category_id, product_images(url, sort_order)').eq('supplier_id', sup.id).eq('is_published', true).limit(60)
    const catId = (prods || []).find((p) => p.category_id)?.category_id ?? null
    const imgs = []
    for (const p of (prods || [])) { const u = (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order)[0]?.url; if (u) imgs.push(u) }

    let i = 0
    for (const [title, condition, unit, source, price] of cfg.lots) {
      const slug = slugify(title) + '-' + Math.random().toString(36).slice(2, 7)
      const ins = await sb.from('products').insert({
        supplier_id: sup.id, category_id: catId, marketplace_context: 'wholesale',
        name: title, slug, price_cents: price, exw_price_cents: price, currency_code: 'EUR',
        min_order_qty: 1, stock_qty: 10, is_published: true,
        is_outlet: true, condition, selling_unit: unit, outlet_source: source, lot_type: unit === 'truck' ? 'truckload' : unit,
        country_of_origin: sup.countries?.name ?? null,
      }).select('id').single()
      if (ins.error) { console.log('lot err', title, ins.error.message); continue }
      const img = imgs[i % Math.max(1, imgs.length)]
      if (img) await sb.from('product_images').insert({ product_id: ins.data.id, url: img, sort_order: 0 })
      lotCount++; i++
    }
    console.log('✓', name, '→', cfg.role, `(${cfg.lots.length} lots)`)
  }

  // Business opportunities
  let oppCount = 0
  for (const o of OPPS) {
    const sup = await getSup(o.who)
    const ins = await sb.from('business_opportunities').insert({
      owner_id: sup?.owner_id ?? null, supplier_id: sup?.id ?? null, company_name: sup?.trade_name ?? o.who,
      poster_role: o.role, kind: o.kind ?? 'looking', looking_for: o.looking, audience: o.aud,
      title: o.title, category: o.cat, country_target: o.country, status: 'open',
      contact_email: 'info@ttaiema.com',
    })
    if (!ins.error) oppCount++
    else console.log('opp err', o.who, ins.error.message)
  }

  console.log(`\nDONE — ${lotCount} demo outlet lots, ${oppCount} opportunities.`)
}
main().catch((e) => console.log('ERR', e.message))
