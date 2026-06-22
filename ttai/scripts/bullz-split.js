require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '3f1b654e-fbcb-48a5-8a4f-6797f1a95778'
const COMBO = 'e205092c-4ad6-4dc5-aafb-3da49518873b'
const CAT = 'af019089-9133-467f-852f-98d167f0b3c8'
const DIR = 'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-22 at 13.29.33'
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const exVat = (allIn) => Math.round((allIn / 1.21) * 100)

const FLAVOURS = [
  { name: 'Classic', colour: 'azul (blue)', imgs: ['WhatsApp Image 2026-06-22 at 13.18.54.jpeg', 'WhatsApp Image 2026-06-22 at 13.18.56.jpeg', 'WhatsApp Image 2026-06-22 at 13.18.57.jpeg'] },
  { name: 'Acid Pop', colour: 'rojo (red)', imgs: ['WhatsApp Image 2026-06-22 at 13.18.55.jpeg', 'WhatsApp Image 2026-06-22 at 13.24.51.jpeg', 'WhatsApp Image 2026-06-22 at 13.24.52.jpeg'] },
  { name: 'Piña & Coco', colour: 'naranja (orange)', imgs: ['WhatsApp Image 2026-06-22 at 13.18.56 (1).jpeg', 'WhatsApp Image 2026-06-22 at 13.26.32.jpeg', 'WhatsApp Image 2026-06-22 at 13.18.57.jpeg'] },
]

async function attach(pid, files, tag) {
  await sb.from('product_images').delete().eq('product_id', pid)
  let n = 0
  for (const f of files) {
    const full = path.join(DIR, f)
    if (!fs.existsSync(full)) { console.log('   missing', f); continue }
    const dest = `bullz/${tag}-${pid}-${n}.jpg`
    const up = await sb.storage.from('brand-assets').upload(dest, fs.readFileSync(full), { contentType: 'image/jpeg', upsert: true })
    if (up.error) { console.log('   img err', up.error.message); continue }
    const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
    await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
  }
  return n
}

async function main() {
  // Remove the combined product (replaced by 3 separate flavour listings)
  await sb.from('product_images').delete().eq('product_id', COMBO)
  await sb.from('products').delete().eq('id', COMBO)
  console.log('Removed combined Bullz listing')

  const UPC = 24, CPP = 90
  for (const fl of FLAVOURS) {
    const name = `Bullz Energy Drink ${fl.name} 250ml`
    // Reuse if a previous run created it
    let { data: ex } = await sb.from('products').select('id').eq('supplier_id', SUP).ilike('name', `%${fl.name}%`).maybeSingle()
    const row = {
      supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
      name, slug: slugify(name),
      brand_name: 'Bullz', product_line: 'Bullz', net_content: '250 ml',
      units_per_carton: UPC, cartons_per_pallet: CPP, pallets_per_truck: null,
      description: `Bullz Energy Drink ${fl.name} — 250 ml, vitaminas y cafeína. Lata ${fl.colour}. www.bullz.es\n\nB2B (EXW, ex-IVA): €0,25/ud → caja (24 uds) €6,00 · palé (90 cajas / 2.160 uds) €540. IVA 21% en España · 0% fuera.\nShop Online (público): €0,65/ud (IVA incluido). Pedido mínimo: 1 caja de 24 uds.`,
      specs: { Brand: 'Bullz', Flavour: fl.name, Colour: fl.colour, 'Net content': '250 ml', 'Units per box': '24', 'Boxes per pallet': '90' },
      price_cents: 25, price_per_box_cents: 600, price_per_pallet_cents: 54000,
      retail_price_cents: exVat(0.65), vat_rate: 21, currency_code: 'EUR',
      sell_piece: true, sell_box: true, sell_pallet: true, sell_truck: false,
      min_order_qty: UPC, min_box_qty: 1, min_pallet_qty: 1,
      stock_qty: 10000, is_published: true, country_of_origin: 'Spain', lead_time: 'Ready to ship',
    }
    let pid
    if (ex) { await sb.from('products').update(row).eq('id', ex.id); pid = ex.id }
    else { const ins = await sb.from('products').insert(row).select('id').single(); if (ins.error) { console.log('err', fl.name, ins.error.message); continue } pid = ins.data.id }
    const n = await attach(pid, fl.imgs, slugify(fl.name))
    console.log(`Bullz ${fl.name}: ${n} images (${pid})`)
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('Bullz products now:', count)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
