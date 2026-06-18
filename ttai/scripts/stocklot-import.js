require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const DE = '2c5266ff-56d9-49e0-8465-ef7c4d453c39'
const CAT_APPL = '7d7357ae-e102-46b8-95c4-beafa9b43b2e' // Home Appliances
const CAT_ELEC = '6c8be190-b0dc-4907-870a-e6f190ac2a81' // Electronics & Technology (root, broad/mixed)

const LIDL_PHOTOS = 'C:/Users/anike/OneDrive/Desktop/tts.es/ttai/WhatsApp Unknown 2026-06-18 at 13.26.22'
const LIDL_XLSX = 'C:/Users/anike/Downloads/lidl 12.06.xlsx Pallet Nr and weigts (1).xlsx'
const FBA_XLSX = 'C:/Users/anike/Downloads/Z00369 Stocklot 66 pallets mix fba (1).xlsx'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const ctype = (f) => /\.png$/i.test(f) ? 'image/png' : /\.(xlsx|xls)$/i.test(f) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'image/jpeg'

async function uploadFile(localPath, dest) {
  const buf = fs.readFileSync(localPath)
  const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(localPath), upsert: true })
  if (up.error) { console.log('  upload err', dest, up.error.message); return null }
  return sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
}

// Insert a product defensively (drop outlet/optional cols if a column is missing).
async function insertProduct(row) {
  let ins = await sb.from('products').insert(row).select('id').single()
  if (ins.error && /column|does not exist/i.test(ins.error.message)) {
    const o = { ...row };
    ['is_outlet', 'outlet_source', 'lot_type', 'condition', 'selling_unit', 'retail_price_cents',
      'catalogue_url', 'sell_pallet', 'price_per_pallet_cents', 'min_pallet_qty',
      'units_per_carton', 'cartons_per_pallet', 'price_on_request', 'lead_time'].forEach(k => delete o[k])
    ins = await sb.from('products').insert(o).select('id').single()
  }
  if (ins.error) { console.log('  product err', ins.error.message); return null }
  return ins.data.id
}

async function main() {
  // ── Supplier: TTAIEMA Stock Lots (house outlet desk — returns direct from chains) ──
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%TTAIEMA Stock Lots%').maybeSingle()
  const supRow = {
    legal_name: 'TTAIEMA Stock Lots', trade_name: 'TTAIEMA Stock Lots', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: DE, brand_slug: 'ttaiema-stocklots', tax_id: 'TTAIEMA-STOCKLOTS',
    reliability_tier: 'GOLD', outlet_role: 'direct_supplier',
    tagline: 'Clearance, customer returns & liquidation lots — by pallet, KG & full truck',
    about_company: 'TTAIEMA Stock Lots is our European liquidation desk — sourcing customer returns, overstock and clearance lots directly from major retail chains (Lidl, Amazon, Aldi, Carrefour, MediaMarkt). Sold by pallet, kilogram, container or full truckload, EXW or DDP across Europe, the Middle East and Africa. Request to buy and our team confirms availability, final price and delivery.',
    description: 'European clearance, returns & liquidation lots — pallets, KG & full truckloads.',
    badges: ['Verified', 'Returns & Clearance', 'Pallets & Truckloads', 'EXW / DDP'],
  }
  if (!sup) {
    let ins = await sb.from('suppliers').insert(supRow).select('id').single()
    if (ins.error) { delete supRow.badges; delete supRow.outlet_role; ins = await sb.from('suppliers').insert(supRow).select('id').single() }
    sup = ins.data; console.log('supplier created')
  } else {
    const upd = { ...supRow }; delete upd.legal_name
    let r = await sb.from('suppliers').update(upd).eq('id', sup.id)
    if (r.error) { delete upd.badges; delete upd.outlet_role; await sb.from('suppliers').update(upd).eq('id', sup.id) }
    console.log('supplier updated')
  }
  const SUP = sup.id
  // Make sure outlet_role sticks even if it was stripped on a fresh insert.
  await sb.from('suppliers').update({ outlet_role: 'direct_supplier' }).eq('id', SUP).then(() => {}, () => {})

  // ── Upload manifests ──
  const lidlManifest = await uploadFile(LIDL_XLSX, 'stocklots/lidl-33-pallets-manifest.xlsx')
  const fbaManifest = await uploadFile(FBA_XLSX, 'stocklots/amazon-z00369-66-pallets-manifest.xlsx')
  console.log('manifests:', !!lidlManifest, !!fbaManifest)

  // ── LOT 1 — LIDL returns, 33 pallets, sold by KG ──
  const lidlDesc =
`LIDL customer returns — 33 mixed pallets from Germany. Sold as a full liquidation lot or by the kilogram.

📦 33 pallets  ·  ⚖️ 6,148 kg net  ·  🧮 ~2,000–2,900 items (est.)
🏷️ Condition: "Mit Mängeln" — customer returns with defects. Mostly small kitchen & home appliances and household goods.
📍 Location: Germany  ·  🚚 Delivery: EXW or DDP available.

PRICING
• Full lot: €25,999
• Per pallet: ≈ €787 (average)
• Per kg: €4.23
• Per item: ≈ €9–€13 (estimate, depends on pallet contents)

RESALE MARGIN
Typical retail PVP €30+ per item depending on the model — strong outlet / resale margin against a ~€9–€13 cost.

📄 Full pallet list (Excel) with pallet numbers & net weights is attached. Request to buy and our team confirms availability, final price & delivery.`

  const lidlId = await insertProduct({
    supplier_id: SUP, category_id: CAT_APPL, marketplace_context: 'both',
    name: 'LIDL Returns — 33 Mixed Pallets (Germany) · Small Appliances & Home',
    slug: 'lidl-returns-33-mixed-pallets-germany-' + Math.random().toString(36).slice(2, 6),
    brand_name: 'Lidl', description: lidlDesc,
    is_outlet: true, outlet_source: 'Lidl Returns', lot_type: 'mixed', condition: 'mixed', selling_unit: 'kg',
    price_cents: 423, currency_code: 'EUR', // €4.23 / kg
    min_order_qty: 180, stock_qty: 6148, // ~1 pallet min · 6,148 kg available
    catalogue_url: lidlManifest, country_of_origin: 'Germany', lead_time: 'EXW / DDP · ready',
    is_published: true,
  })
  console.log('LIDL lot:', lidlId)

  // Upload the 11 Lidl pallet photos (largest first = clearest hero).
  if (lidlId) {
    const files = fs.readdirSync(LIDL_PHOTOS).filter(f => /\.(jpe?g|png)$/i.test(f))
      .map(f => ({ f, size: fs.statSync(path.join(LIDL_PHOTOS, f)).size }))
      .sort((a, b) => b.size - a.size)
    await sb.from('product_images').delete().eq('product_id', lidlId)
    let n = 0
    for (const { f } of files) {
      const url = await uploadFile(path.join(LIDL_PHOTOS, f), `stocklots/lidl/${lidlId}-${n}${path.extname(f)}`)
      if (url) { await sb.from('product_images').insert({ product_id: lidlId, url, sort_order: n }); n++ }
    }
    console.log('  LIDL photos uploaded:', n)
  }

  // ── LOT 2 — Amazon FBA returns, 66 pallets, sold per pallet ──
  const fbaDesc =
`Amazon FBA customer returns — 66 mixed pallets (Stocklot Z00369). Full itemized manifest with 7,835 pieces.

📦 66 pallets  ·  🧮 7,835 pieces  ·  📋 Itemized Excel (EAN / ASIN / category)
🏷️ Mixed Amazon returns across: Sports (1,840), Home (1,032), Automotive (711), PC (663), Electronics (564), Home Improvement (563), Pet (543), Garden, Furniture, Luggage, Kitchen, Beauty & more.
📍 Location: Germany / EU  ·  🚚 Delivery: EXW or DDP available.

PRICING
• Full lot: €17,500
• Per pallet: €265
• Per item: €2.24

RESALE MARGIN
Typical retail PVP up to €30 per item depending on the model vs. €2.24 cost — strong resale margin (≈ €32,000 estimated market value).

📄 Full itemized manifest (Excel, 7,835 lines) is attached. Request to buy and our team confirms availability, final price & delivery.`

  const fbaId = await insertProduct({
    supplier_id: SUP, category_id: CAT_ELEC, marketplace_context: 'both',
    name: 'Amazon FBA Returns — 66 Mixed Pallets · Sports, Home, Auto, PC & Electronics',
    slug: 'amazon-fba-returns-66-mixed-pallets-z00369-' + Math.random().toString(36).slice(2, 6),
    brand_name: 'Amazon', description: fbaDesc,
    is_outlet: true, outlet_source: 'Amazon Returns', lot_type: 'mixed', condition: 'mixed', selling_unit: 'mixed_pallet',
    price_cents: 26500, currency_code: 'EUR', // €265 / pallet
    retail_price_cents: 3000, // illustrative PVP €30 / item
    sell_piece: false, sell_pallet: true, price_per_pallet_cents: 26500, min_pallet_qty: 1,
    units_per_carton: 1, cartons_per_pallet: 119, // ~7,835 / 66 ≈ 119 items per pallet
    stock_qty: 66, catalogue_url: fbaManifest, country_of_origin: 'Germany / EU', lead_time: 'EXW / DDP · ready',
    is_published: true,
  })
  console.log('FBA lot:', fbaId)

  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('DONE · TTAIEMA Stock Lots total products:', count)
}
main().catch((e) => console.log('ERR', e.message))
