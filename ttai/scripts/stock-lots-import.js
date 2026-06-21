require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const PL = '46747925-dbe0-4745-bf24-f2179b7fb69e'
const IMG_DIR = 'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-21 at 19.35.34'
const CAVEAT = '\n\n⚠ Live warehouse stock — quantities are as of the current list date and may change as items sell. Please confirm current availability before ordering.'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)

async function ensureCategory({ slug, name, parent_id, depth, sort_order }) {
  let { data } = await sb.from('categories').select('id').eq('slug', slug).maybeSingle()
  if (data) return data.id
  const ins = await sb.from('categories').insert({ slug, name, parent_id, depth, sort_order, marketplace_context: 'both', status: 'active' }).select('id').single()
  if (ins.error) { console.log('cat err', slug, ins.error.message); return null }
  console.log('category created:', slug)
  return ins.data.id
}

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

async function attachImages(productId, minutePrefix, cap = 12) {
  if (!minutePrefix) return 0
  const files = fs.readdirSync(IMG_DIR)
    .filter((f) => /\.jpe?g$/i.test(f) && f.includes(`at ${minutePrefix}.`))
    .sort().slice(0, cap)
  let n = 0
  for (const f of files) {
    const buf = fs.readFileSync(path.join(IMG_DIR, f))
    const dest = `stock-polska/${productId}-${n}.jpg`
    const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: 'image/jpeg', upsert: true })
    if (up.error) { console.log('  img err', up.error.message); continue }
    const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
    await sb.from('product_images').insert({ product_id: productId, url, sort_order: n })
    n++
  }
  return n
}

const LOTS = [
  { cat: 'fashion-shoes', name: 'Mono Way Shoes — Stock Lot (800 pairs)', brand: 'Mono Way', line: 'Mono Way', pcs: 800, price: 20.5, por: false, img: '20.26',
    desc: "Mono Way branded sneakers — wholesale stock lot. 33 articles, 800 pairs. Women's sneakers, sizes 36–45 (full size runs). Sold per pcs." },
  { cat: 'fashion-bags', name: 'Versace Bags — Stock Lot (2000 pcs)', brand: 'Versace', line: 'Versace', pcs: 2000, price: 22.5, por: false, img: null,
    desc: 'Versace bags lot — different models, bags only (no wallets). 2000 pcs. Sold per pcs.' },
  { cat: 'fashion-shoes', name: 'Premium Brands Shoes — Truck 2 — Stock Lot (1045 pcs)', brand: 'Mixed Premium', line: 'Premium Brands', pcs: 1045, price: 16.5, por: false, img: null,
    desc: 'Premium branded shoes mixed lot (Truck 2). 1045 pairs, 255 models. Brands incl. Superdry, Guess, DC, Pepe Jeans, Scholl Iconic, Diadora, Filling Pieces, Liu Jo, Quiksilver, Cariuma, Billabong, Antony Morato, Roxy, Desigual, Hackett, Element, Ellesse, Trussardi, Bash. Men 616 / Women 422 / Kids 7. Sold per pcs.' },
  { cat: 'fashion-clothing', name: 'Calvin Klein Lot A /2331 — Stock Lot (2430 pcs)', brand: 'Calvin Klein', line: 'Calvin Klein', pcs: 2430, price: 0, por: true, img: '20.27',
    desc: 'Calvin Klein branded clothing lot — Grade I (A, first quality). 2430 pcs. Woman 1522 / Man 711 / Kids 181 / Mix 16. Categories: T-shirts, trousers, dresses, knitwear, outerwear, pajamas, shorts, skirts, tops, accessories, shoes, bags. Source: stock-polska.com (Poland). Price on request.' },
  { cat: 'fashion-clothing', name: 'Tommy Hilfiger Lot B 2332 — Stock Lot (9185 pcs)', brand: 'Tommy Hilfiger', line: 'Tommy Hilfiger', pcs: 9185, price: 0, por: true, img: '20.28',
    desc: 'Tommy Hilfiger branded clothing lot. 9185 pcs, 2498 models. Total RRP €1,143,071.90. Woman 6847 / Men 2095 / Kids 218 / Unisex 25. Categories: dresses, pants, t-shirts, knitwear, shorts, outerwear, swimwear, underwear, skirts, tops, shoes, accessories, bras, bags. Source: stock-polska.com (Poland). Price on request.' },
  { cat: 'fashion-bags', name: '19V69 Italia Bags (December) — Stock Lot (1998 pcs)', brand: '19V69 Italia', line: '19V69 Italia', pcs: 1998, price: 0, por: true, img: null,
    desc: '19V69 Italia (Versace 1969 Abbigliamento Sportivo) — bags stock lot, December list. 1998 pcs across 84 models/colours, one-size (OS). RRP ~€159–€180 per bag. Price on request.' },
]

async function main() {
  // 1) Fashion category tree
  const root = await ensureCategory({ slug: 'fashion-apparel', name: 'Fashion & Apparel', parent_id: null, depth: 0, sort_order: 5 })
  const CAT = {
    'fashion-clothing': await ensureCategory({ slug: 'fashion-clothing', name: 'Clothing', parent_id: root, depth: 1, sort_order: 1 }),
    'fashion-shoes': await ensureCategory({ slug: 'fashion-shoes', name: 'Shoes & Footwear', parent_id: root, depth: 1, sort_order: 2 }),
    'fashion-bags': await ensureCategory({ slug: 'fashion-bags', name: 'Bags & Accessories', parent_id: root, depth: 1, sort_order: 3 }),
  }

  // 2) Supplier
  const SUP = await ensureSupplier({
    legal_name: 'Stock Polska', trade_name: 'Stock Polska', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'wholesale', country_id: PL, tax_id: 'PL-STOCK-POLSKA', brand_slug: 'stock-polska', reliability_tier: 'SILVER',
    tagline: 'Branded fashion stock lots — clothing, shoes & bags (wholesale by the lot)',
    about_company: 'Stock Polska supplies branded fashion stock lots — original-brand clothing, footwear and bags (Calvin Klein, Tommy Hilfiger, Mono Way, 19V69 Italia and premium mixes) sold by the truck/lot or per piece. Based in Wielogłowy, Poland (stock-polska.com). Stock is live and sells fast — confirm current availability before ordering.',
    description: 'Branded fashion stock lots — Calvin Klein, Tommy Hilfiger, Mono Way, 19V69 & premium mixed. Wholesale by lot / per pcs.',
    badges: ['Poland Supplier', 'Branded Stock Lots', 'Wholesale', 'Clearance'],
  })

  // 3) Lots
  let ok = 0
  for (const L of LOTS) {
    const id = await insertProduct({
      supplier_id: SUP, category_id: CAT[L.cat], marketplace_context: 'wholesale',
      name: L.name.slice(0, 140),
      slug: slugify(L.name) + '-' + Math.random().toString(36).slice(2, 6),
      brand_name: L.brand, product_line: L.line,
      description: L.desc + CAVEAT,
      specs: { Brand: L.brand, 'Total pcs': String(L.pcs), Source: 'Stock Polska (Poland)', Incoterm: 'EXW Poland' },
      price_cents: Math.round(L.price * 100), price_on_request: L.por, currency_code: 'EUR',
      min_order_qty: 1, stock_qty: L.pcs, lead_time: 'Stock — confirm availability', is_published: true, country_of_origin: 'Mixed / EU',
    })
    if (!id) continue
    ok++
    const n = await attachImages(id, L.img)
    console.log(`  ${L.name} → ${L.por ? 'price on request' : '€' + L.price + '/pcs'}, ${L.pcs} pcs, ${n} images`)
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`Stock Polska: ${count} lots (inserted ${ok} of ${LOTS.length})`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
