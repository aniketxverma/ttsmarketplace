require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const MA = '31e3b23c-dae1-482d-8165-c12eae6e6f67' // Morocco
const CAT = 'af019089-9133-467f-852f-98d167f0b3c8' // Beverages
const HUDAROM_IMG = 'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-22 at 12.53.21'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const exVat = (allIn) => Math.round((allIn / 1.21) * 100) // store ex-VAT so platform's 21% lands on the all-in target

async function ensureSupplier(row) {
  let { data: sup } = await sb.from('suppliers').select('id').eq('brand_slug', row.brand_slug).maybeSingle()
  if (!sup) {
    let ins = await sb.from('suppliers').insert(row).select('id').single()
    if (ins.error) { const r = { ...row }; delete r.badges; ins = await sb.from('suppliers').insert(r).select('id').single() }
    if (ins.error) { console.log('supplier err', ins.error.message); process.exit(1) }
    sup = ins.data; console.log(row.trade_name, 'CREATED', sup.id)
  } else { console.log(row.trade_name, 'exists', sup.id) }
  return sup.id
}

async function upsertProduct(brandSlugSupId, row, matchName) {
  let { data: ex } = await sb.from('products').select('id').eq('supplier_id', brandSlugSupId).ilike('name', matchName).maybeSingle()
  if (ex) { await sb.from('products').update(row).eq('id', ex.id); console.log('  product updated', ex.id); return ex.id }
  const ins = await sb.from('products').insert(row).select('id').single()
  if (ins.error) { console.log('  product err', ins.error.message); return null }
  console.log('  product CREATED', ins.data.id); return ins.data.id
}

async function attachImages(pid, dir, prefix) {
  if (!fs.existsSync(dir)) return 0
  await sb.from('product_images').delete().eq('product_id', pid)
  let n = 0
  for (const f of fs.readdirSync(dir).sort()) {
    if (!/\.jpe?g$/i.test(f)) continue
    const buf = fs.readFileSync(path.join(dir, f))
    const dest = `${prefix}/${pid}-${n}.jpg`
    const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: 'image/jpeg', upsert: true })
    if (up.error) { console.log('  img err', up.error.message); continue }
    const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
    await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
  }
  return n
}

async function main() {
  // ── HUDAROM — Café Molido (250 g ground coffee, Portugal/Morocco import) ──
  // B2B (ex-VAT): box €2.10 (20 pcs) · pallet €173 (90 box = 1800 pcs).
  // Retail (Shop Online, all-in): box of 20 ≈ €3.00 → ~€0.15/pc all-in. Min 1 box (20 pcs).
  const H = await ensureSupplier({
    legal_name: 'Hudarom', trade_name: 'Hudarom', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: MA, tax_id: 'MA-HUDAROM', brand_slug: 'hudarom', reliability_tier: 'SILVER',
    tagline: 'Hudarom — Café Molido de Tueste Natural (100%) · traditional ground coffee',
    about_company: 'Hudarom is a traditional 100% natural roasted & ground coffee (Café Molido de Tueste Natural) — made in Portugal, imported by Hudarom (M\'Diq, Morocco). Vacuum-packed in 250 g bags. Ideal for traditional/Turkish-style preparation. Sold by the box (20 × 250 g) and pallet, plus retail in the Shopping Mall.',
    description: 'Hudarom Café Molido — 100% natural ground coffee, 250 g. Wholesale by box & pallet + retail.',
    badges: ['Coffee', '100% Natural', 'Wholesale'],
  })
  const HUPC = 20, HCPP = 90
  const hid = await upsertProduct(H, {
    supplier_id: H, category_id: CAT, marketplace_context: 'both',
    name: 'Hudarom Café Molido Tueste Natural 250g', slug: slugify('hudarom-cafe-molido-tueste-natural-250g'),
    brand_name: 'Hudarom', product_line: 'Café Molido', net_content: '250 g',
    units_per_carton: HUPC, cartons_per_pallet: HCPP, pallets_per_truck: null,
    description: 'Hudarom Café Molido de Tueste Natural (100%) — 250 g, café tostado y molido, envasado al vacío. Fabricado en Portugal, importado por Hudarom (M\'Diq, Marruecos).\n\nB2B (EXW, ex-IVA): caja (20 uds) €2,10 · palé (90 cajas / 1.800 uds) €173. IVA 21% en España · 0% fuera. Envío incluido.\nShop Online (público): caja de 20 uds ≈ €3,00 (IVA incluido). Pedido mínimo: 1 caja de 20 uds.',
    specs: { Brand: 'Hudarom', 'Net content': '250 g', 'Units per box': '20', 'Boxes per pallet': '90', Origin: 'Made in Portugal', Importer: 'Hudarom (Morocco)' },
    price_cents: 11, price_per_box_cents: 210, price_per_pallet_cents: 17300,
    retail_price_cents: exVat(3.00 / HUPC), vat_rate: 21, currency_code: 'EUR',
    sell_piece: true, sell_box: true, sell_pallet: true, sell_truck: false,
    min_order_qty: HUPC, min_box_qty: 1, min_pallet_qty: 1,
    stock_qty: 5000, is_published: true, country_of_origin: 'Portugal', lead_time: 'Ready to ship',
  }, '%Café Molido%')
  if (hid) console.log('  Hudarom images:', await attachImages(hid, HUDAROM_IMG, 'hudarom'))

  // ── BULLZ — energy drink (24/box, 3 colours/flavours) ──
  // B2B (ex-VAT): €0.25/pc → box €6.00 (24) · pallet €540 (90 box = 2160 pcs). Mixed 3 colours OK.
  // Retail (Shop Online, all-in): €0.65/pc. Min order 24 pcs (1 box per model).
  const { data: esRow } = await sb.from('countries').select('id').eq('iso_code', 'ES').maybeSingle()
  const B = await ensureSupplier({
    legal_name: 'Bullz', trade_name: 'Bullz', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: esRow?.id ?? null, tax_id: 'ES-BULLZ', brand_slug: 'bullz', reliability_tier: 'SILVER',
    tagline: 'Bullz — energy drink (3 flavours) · wholesale & retail',
    about_company: 'Bullz energy drink — available in 3 flavours/colours, sold by the case of 24. Wholesale by box & pallet (mixed colours allowed) and retail in the Shopping Mall. [Product details to confirm.]',
    description: 'Bullz energy drink — 3 flavours, 24 per case. Wholesale + retail.',
    badges: ['Energy Drink', 'Wholesale', '3 Flavours'],
  })
  const BUPC = 24, BCPP = 90
  await upsertProduct(B, {
    supplier_id: B, category_id: CAT, marketplace_context: 'both',
    name: 'Bullz Energy Drink 250ml (3 flavours)', slug: slugify('bullz-energy-drink-250ml'),
    brand_name: 'Bullz', product_line: 'Bullz', net_content: '250 ml',
    units_per_carton: BUPC, cartons_per_pallet: BCPP, pallets_per_truck: null,
    description: 'Bullz energy drink — 250 ml. Available in 3 colours/flavours (mixed box allowed).\n\nB2B (EXW, ex-IVA): €0,25/ud → caja (24 uds) €6,00 · palé (90 cajas / 2.160 uds) €540. IVA 21% en España · 0% fuera.\nShop Online (público): €0,65/ud (IVA incluido). Pedido mínimo: 24 uds (1 caja por modelo).\n\n[Imágenes y nombres de los 3 colores pendientes de confirmar.]',
    specs: { Brand: 'Bullz', 'Net content': '250 ml', 'Units per box': '24', 'Boxes per pallet': '90', Variants: '3 colours/flavours (mixed box)' },
    price_cents: 25, price_per_box_cents: 600, price_per_pallet_cents: 54000,
    retail_price_cents: exVat(0.65), vat_rate: 21, currency_code: 'EUR',
    sell_piece: true, sell_box: true, sell_pallet: true, sell_truck: false,
    min_order_qty: BUPC, min_box_qty: 1, min_pallet_qty: 1,
    stock_qty: 10000, is_published: true, country_of_origin: 'Spain', lead_time: 'Ready to ship',
  }, '%Bullz%')

  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
