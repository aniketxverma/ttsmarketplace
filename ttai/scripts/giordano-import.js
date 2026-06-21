require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const IT = 'c07ae8f7-bf92-498c-b35a-32fe38db8b22'
const CAT_SLUG = 'food-beverages-std'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const catId = async (slug) => (await sb.from('categories').select('id').eq('slug', slug).single()).data?.id

async function ensureSupplier(row) {
  let { data: sup } = await sb.from('suppliers').select('id').eq('brand_slug', row.brand_slug).maybeSingle()
  if (!sup) {
    let ins = await sb.from('suppliers').insert(row).select('id').single()
    if (ins.error) { const r = { ...row }; delete r.badges; ins = await sb.from('suppliers').insert(r).select('id').single() }
    if (ins.error) { console.log('supplier err', ins.error.message); process.exit(1) }
    sup = ins.data; console.log(row.trade_name, 'CREATED', sup.id)
  } else {
    const upd = { ...row }; delete upd.legal_name; delete upd.brand_slug
    let r = await sb.from('suppliers').update(upd).eq('id', sup.id)
    if (r.error) { delete upd.badges; await sb.from('suppliers').update(upd).eq('id', sup.id) }
    console.log(row.trade_name, 'updated', sup.id)
  }
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

// line, name, net, price(€), box, pallet, units(per carton), flavors/notes
const P = [
  // Roasted coffee beans 1kg — Box 10kg, Pallet 540kg
  ['Coffee Beans', 'Sublime — Roasted Coffee Beans', '1000 g', 12.28, 'Box 10 kg', 'Pallet 540 kg', 10, '90% Arabica / 10% Robusta. Premium blend for the most demanding coffee lovers.'],
  ['Coffee Beans', 'Vellutata — Roasted Coffee Beans', '1000 g', 11.02, 'Box 10 kg', 'Pallet 540 kg', 10, '40% Arabica / 60% Robusta. Dense body, intense flavour.'],
  ['Coffee Beans', 'Vigorosa — Roasted Coffee Beans', '1000 g', 10.29, 'Box 10 kg', 'Pallet 540 kg', 10, '20% Arabica / 80% Robusta. Intense and persistent.'],
  ['Coffee Beans', 'Decaffeinated — Roasted Coffee Beans', '1000 g', 19.10, 'Box 10 kg', 'Pallet 540 kg', 10, '20% Arabica / 80% Robusta, <0.10% caffeine.'],
  // Gold coffee — Pallet 600 pc
  ['Gold Coffee', 'Gold Coffee 500g + Gold Spray', '500 g', 23.00, '', 'Pallet 600 pc', null, 'Dark-roast blend with 2% edible gold. Dense crema, caramel notes. Includes gold spray.'],
  ['Gold Coffee', 'Gold Spray', '3 g', 12.00, '', '', null, 'Edible gold spray, 3 g.'],
  // Ground coffee 250g — Box 48pc, Pallet 2592
  ['Ground Coffee', 'Sublime — Ground Coffee 250g', '250 g', 3.10, 'Box 48 pc', 'Pallet 2592 pc', 48, '90% Arabica / 10% Robusta. For moka, napoletana, filter and Turkish (ibrik).'],
  ['Ground Coffee', 'Vellutata — Ground Coffee 250g', '250 g', 3.00, 'Box 48 pc', 'Pallet 2592 pc', 48, '40% Arabica / 60% Robusta ground.'],
  ['Ground Coffee', 'Vigorosa — Ground Coffee 250g', '250 g', 2.80, 'Box 48 pc', 'Pallet 2592 pc', 48, '20% Arabica / 80% Robusta ground.'],
  ['Ground Coffee', 'Decaffeinato — Ground Coffee 250g', '250 g', 4.06, 'Box 48 pc', 'Pallet 2592 pc', 48, 'Decaffeinated ground coffee.'],
  // Flavoured ground 250g — Box 34pc, Pallet 1836 — single price
  ['Flavored Ground Coffee', 'Flavored Ground Coffee 250g', '250 g', 4.10, 'Box 34 pc', 'Pallet 1836 pc', 34, 'Flavours: Hazelnut, Chocolate, Ginseng, Rum, Cinnamon, Caramel.'],
  // Cardamom 250g — Box 22pc, Pallet 1188 (NEW)
  ['Ground Coffee', 'Cardamom Ground Coffee 250g', '250 g', 4.60, 'Box 22 pc', 'Pallet 1188 pc', 22, 'Middle-Eastern style coffee with crushed cardamom. Warm, spiced, citrus notes. (NEW)'],
  // ESE pods 44mm — Box 250 of 50 / Box 128 of 150
  ['ESE Pods (44mm)', 'ESE Pods Vigorosa/Vellutata — 50 pods', '50 pods', 5.30, 'Box 250 (of 50)', '', null, 'Eco ESE paper-filter pods, 44 mm.'],
  ['ESE Pods (44mm)', 'ESE Pods Vigorosa/Vellutata — 150 pods', '150 pods', 15.40, 'Box 128 (of 150)', '', null, 'Eco ESE paper-filter pods, 44 mm.'],
  ['ESE Pods (44mm)', 'ESE Pods Decaffeinate — 50 pods', '50 pods', 7.40, 'Box 250 (of 50)', '', null, 'Eco ESE paper-filter pods, 44 mm, decaf.'],
  ['ESE Pods (44mm)', 'ESE Pods Decaffeinate — 150 pods', '150 pods', 21.50, 'Box 128 (of 150)', '', null, 'Eco ESE paper-filter pods, 44 mm, decaf.'],
  // Flavoured ESE pods + infusions 44mm — Box 756 of 15 / Box 250 of 50
  ['ESE Pods (44mm)', 'Flavored ESE Pods & Infusions — 15 pods', '15 pods', 2.70, 'Box 756 (of 15)', '', null, 'Flavours: chocolate, hazelnut, cinnamon, caramel, ginseng, rum, elderflower, blonde tea. Infusions: tea, relaxing, red fruits, barley.'],
  ['ESE Pods (44mm)', 'Flavored ESE Pods & Infusions — 50 pods', '50 pods', 7.70, 'Box 250 (of 50)', '', null, 'Flavoured ESE pods & infusions, 44 mm.'],
  // Nespresso-compatible capsules — Box 128 of 100 / Box 250 of 30
  ['Nespresso-compatible Capsules', 'Nespresso-compatible Vellutata/Vigorosa — 30 caps', '30 capsules', 4.43, 'Box 250 (of 30)', '', null, 'Compatible with Nespresso* system.'],
  ['Nespresso-compatible Capsules', 'Nespresso-compatible Vellutata/Vigorosa — 100 caps', '100 capsules', 14.50, 'Box 128 (of 100)', '', null, 'Compatible with Nespresso* system.'],
  ['Nespresso-compatible Capsules', 'Nespresso-compatible Decaffeinate — 30 caps', '30 capsules', 5.43, 'Box 250 (of 30)', '', null, 'Compatible with Nespresso* system, decaf.'],
  ['Nespresso-compatible Capsules', 'Nespresso-compatible Decaffeinate — 100 caps', '100 capsules', 17.31, 'Box 128 (of 100)', '', null, 'Compatible with Nespresso* system, decaf.'],
  ['Nespresso-compatible Capsules', 'Nespresso-compatible Self-protected — 100 caps', '100 capsules', 15.30, 'Box 128 (of 100)', '', null, 'Self-protected (autoprotette) capsules, Nespresso*-compatible.'],
  ['Nespresso-compatible Capsules', 'Nespresso-compatible Self-protected (premium) — 100 caps', '100 capsules', 17.55, 'Box 128 (of 100)', '', null, 'Self-protected (autoprotette) capsules, Nespresso*-compatible.'],
  // Soluble Nespresso-compatible/self-protected — Box 15pc, Pallet 2160 of 10
  ['Nespresso-compatible Capsules', 'Soluble Flavored Capsules (Nespresso-compatible) — 10 caps', '10 capsules', 1.98, 'Box 15 pc', 'Pallet 2160 (of 10)', null, 'Soluble plastic capsules. Flavours: chocolate, white chocolate, hazelnut, cinnamon, caramel, ginseng, mocha, cappuccino, crème brûlée, chamomile, turmeric & cinnamon, lemon tea, white drink, red fruits, cortado.'],
  // Dolce Gusto-compatible — Box 128 of 100 / Box 250 of 50
  ['Dolce Gusto-compatible Capsules', 'Dolce Gusto-compatible Vellutata/Vigorosa — 30 caps', '30 capsules', 5.81, 'Box 250 (of 50)', '', null, 'Compatible with Dolce Gusto* system.'],
  ['Dolce Gusto-compatible Capsules', 'Dolce Gusto-compatible Vellutata/Vigorosa — 100 caps', '100 capsules', 18.56, 'Box 128 (of 100)', '', null, 'Compatible with Dolce Gusto* system.'],
  ['Dolce Gusto-compatible Capsules', 'Dolce Gusto-compatible Decaffeinate — 30 caps', '30 capsules', 6.68, 'Box 250 (of 50)', '', null, 'Compatible with Dolce Gusto* system, decaf.'],
  ['Dolce Gusto-compatible Capsules', 'Dolce Gusto-compatible Decaffeinate — 100 caps', '100 capsules', 21.50, 'Box 128 (of 100)', '', null, 'Compatible with Dolce Gusto* system, decaf.'],
  // Dolce Gusto soluble — Box 12pc, Pallet 756 of 16
  ['Dolce Gusto-compatible Capsules', 'Dolce Gusto Soluble Flavored Capsules — 16 caps', '16 capsules', 4.63, 'Box 12 pc', 'Pallet 756 (of 16)', null, 'Soluble Dolce Gusto* capsules. Flavours incl. chocolate, white chocolate, tiramisu, hazelnut, caramel, ginseng, mocha, cappuccino, crème brûlée, biscuit, chamomile, lactose-free options + infusions.'],
  // Cappuccino 3-in-1 — Box 33 jars, Pallet 1782
  ['Instant Cappuccino', 'Cappuccino Instant 3-in-1 250g', '250 g', 3.75, 'Box 33 jars', 'Pallet 1782 jars', 33, 'Instant 3-in-1 coffee + milk + sugar. Also: Breakfast Chocolate, Coffee with Ginseng, Hazelnut.'],
  // Instant coffee — Box 33 of 100g / Box 22 of 200g
  ['Instant Coffee', 'Instant Coffee Espresso (Freeze-dried) 100g', '100 g', 3.58, 'Box 33 jars', 'Pallet 1782 jars', 33, '100% pure instant coffee, freeze-dried. (NEW)'],
  ['Instant Coffee', 'Instant Coffee Classic (Agglomerate) 100g', '100 g', 3.49, 'Box 33 jars', 'Pallet 1782 jars', 33, '100% pure instant coffee, agglomerated.'],
  ['Instant Coffee', 'Instant Coffee Crema (Spray-dried) 100g', '100 g', 3.47, 'Box 33 jars', 'Pallet 1782 jars', 33, '100% pure instant coffee, spray-dried.'],
  ['Instant Coffee', 'Instant Coffee Espresso (Freeze-dried) 200g', '200 g', 5.16, 'Box 22 jars', 'Pallet 1188 jars', 22, '100% pure instant coffee, freeze-dried.'],
  ['Instant Coffee', 'Instant Coffee Classic (Agglomerate) 200g', '200 g', 4.98, 'Box 22 jars', 'Pallet 1188 jars', 22, '100% pure instant coffee, agglomerated.'],
  ['Instant Coffee', 'Instant Coffee Crema (Spray-dried) 200g', '200 g', 4.94, 'Box 22 jars', 'Pallet 1188 jars', 22, '100% pure instant coffee, spray-dried.'],
  // Drip coffee bag — 34 packs of 5 sachets, Pallet 9180
  ['Drip Coffee', 'Drip Coffee Bag — 5 sachets', '5 sachets', 2.88, 'Box 34 (of 5 sachets)', 'Pallet 9180', null, 'Single-serve drip coffee bags. (NEW)'],
  // Cold brew — Box 24 cans, Pallet 1200
  ['Cold Brew', 'Cold Brew Coffee Can 200ml', '200 ml', 1.98, 'Box 24 cans', 'Pallet 1200 cans', 24, 'Ethiopian cold-brew extract, sugar-free, sparkling. (NEW)'],
  // Chocolate-covered beans — Box 33 jars, Pallet 1782
  ['Chocolate-Covered Beans', 'Chocolate-Covered Coffee Beans 300g', '300 g', 7.40, 'Box 33 jars', 'Pallet 1782 jars', 33, 'Available in milk chocolate and dark chocolate. (NEW)'],
]

async function main() {
  const CAT = await catId(CAT_SLUG)
  const SUP = await ensureSupplier({
    legal_name: 'Caffè De Plata & C. s.a.s. (Giordano)', trade_name: 'Giordano', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: IT, tax_id: 'IT-05333310653', brand_slug: 'giordano', reliability_tier: 'GOLD',
    tagline: 'Giordano · caffè del piacere — premium Italian coffee (Made in Italy, EXW)',
    about_company: 'Giordano (Caffè De Plata & C. s.a.s., Pontecagnano, Italy) is a premium Italian coffee roaster — Made in Italy. Range covers roasted beans, ground coffee, Gold edible-gold coffee, ESE pods, Nespresso & Dolce Gusto compatible capsules, instant coffee, cold brew and chocolate-covered beans. Blends: Sublime (90/10), Vellutata (40/60), Vigorosa (20/80) and Decaffeinato. Winner of the European Hotel Award Silver Premium 2024; BIO certified. Prices EXW their warehouse, in EUR.',
    description: 'Premium Italian coffee — beans, ground, capsules (Nespresso/Dolce Gusto), instant, cold brew. Made in Italy, EXW.',
    badges: ['Italy Supplier', 'Made in Italy', 'Premium Coffee', 'Wholesale', 'EXW'],
  })

  let ok = 0
  for (const [line, name, net, price, box, pallet, units, note] of P) {
    const id = await insertProduct({
      supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
      name: `Giordano ${name}`.replace(/\s+/g, ' ').slice(0, 140).trim(),
      slug: slugify(`giordano-${name}`) + '-' + Math.random().toString(36).slice(2, 6),
      brand_name: 'Giordano', product_line: line,
      net_content: net, units_per_carton: units,
      description: `Giordano ${name} — ${net}. ${note}\nIncoterm: EXW (ex our warehouse), EUR.${box ? `\n${box}.` : ''}${pallet ? `\n${pallet}.` : ''}`,
      specs: { Incoterm: 'EXW', Brand: 'Giordano', 'Net content': net, Box: box || '', Pallet: pallet || '', 'Made in': 'Italy' },
      price_cents: Math.round(price * 100), currency_code: 'EUR',
      min_order_qty: 1, stock_qty: 100, lead_time: 'EXW · ready', is_published: true, country_of_origin: 'Italy',
    })
    if (id) ok++
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`Giordano: ${count} products (inserted ${ok} of ${P.length})`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
