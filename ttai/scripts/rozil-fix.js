require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ROZIL = '43d90c96-3284-4f12-9db4-5e956fd4829b'
const CAT = '2e77ccc1-5485-49b3-8f3f-b3efc77d2a2f'
const FOLDERS = [
  'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-21 at 20.15.56',
  'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-21 at 20.15.55',
]
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)

async function uploadFile(file, dest, contentType) {
  const buf = fs.readFileSync(file)
  const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType, upsert: true })
  if (up.error) { console.log('  upload err', up.error.message); return null }
  return sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
}

async function main() {
  // ── 1) Universal packaging + VAT + B2B/retail unit fixes across all Rozil SKUs ──
  // 1 box = 4 pcs · 1 pallet = 60 boxes (240 pcs) · 1 truck = 33 pallets (7,920 pcs).
  // (units_per_carton kept per product: 4 for 2.8L, 3 for 4.8L.)
  const upd = await sb.from('products').update({
    cartons_per_pallet: 60, pallets_per_truck: 33, vat_rate: 21,
    sell_piece: true, sell_box: true, sell_pallet: true, sell_truck: true,
    min_box_qty: 1, min_pallet_qty: 1, min_truck_qty: 1,
  }).eq('supplier_id', ROZIL)
  console.log(upd.error ? 'bulk update err: ' + upd.error.message : 'Packaging/VAT/units updated on all Rozil SKUs')

  // ── 2) New model: Rozil Arabic-Perfume detergent (Family: Detergente for cloth) ──
  // Tai's tiered B2B pricing per pcs: box €2.10 · pallet €1.85 · truck €1.59.
  // Retail: 1 box of 4 pcs = €14.50  (→ €3.625/pc, VAT 21% added in Spain / 0% outside).
  const UPC = 4, CPP = 60, PPT = 33
  const palletPcs = UPC * CPP            // 240
  const truckPcs = palletPcs * PPT       // 7920
  const name = 'Rozil Perfume Árabe — Detergente Ropa 2.8L'
  let { data: existing } = await sb.from('products').select('id').eq('supplier_id', ROZIL).ilike('name', '%Perfume Árabe%').maybeSingle()
  let pid = existing?.id
  const row = {
    supplier_id: ROZIL, category_id: CAT, marketplace_context: 'both',
    name, slug: slugify(name) + '-ar',
    brand_name: 'Rozil', product_line: 'Detergents',
    description: 'Rozil Detergente para ropa con Perfume Árabe — nuevo modelo (fragancia árabe intensa y duradera). 2,8 L.\n\nB2B (EXW): por caja €2,10/ud · por palé €1,85/ud · por camión €1,59/ud.\n1 caja = 4 uds · 1 palé = 60 cajas (240 uds) · 1 camión = 33 palés (7.920 uds).\nIVA 21% en España · 0% fuera de España. Coste de envío aprox. +10% según destino.\nVenta al público (end user): 1 caja de 4 uds = €14,50 (≈ €3/ud, IVA y envío incluidos).',
    net_content: '2.8 L', units_per_carton: UPC, cartons_per_pallet: CPP, pallets_per_truck: PPT,
    price_cents: 210,                                  // wholesale base per pc (box tier)
    price_per_box_cents: Math.round(2.10 * UPC * 100),       // €8.40 / box
    price_per_pallet_cents: Math.round(1.85 * palletPcs * 100), // €444 / pallet
    price_per_truck_cents: Math.round(1.59 * truckPcs * 100),   // €12,592.80 / truck
    retail_price_cents: Math.round(14.50 / UPC * 100),          // €3.63 / pc (box of 4 = €14.50)
    vat_rate: 21, currency_code: 'EUR',
    sell_piece: true, sell_box: true, sell_pallet: true, sell_truck: true,
    min_order_qty: 1, min_box_qty: 1, min_pallet_qty: 1, min_truck_qty: 1,
    stock_qty: 5000, is_published: true, country_of_origin: 'Spain', lead_time: 'EXW Málaga',
  }
  if (pid) { await sb.from('products').update(row).eq('id', pid); console.log('Arabic-Perfume model updated', pid) }
  else {
    const ins = await sb.from('products').insert(row).select('id').single()
    if (ins.error) { console.log('insert err', ins.error.message); return }
    pid = ins.data.id; console.log('Arabic-Perfume model CREATED', pid)
  }

  // ── 3) Attach media (images + one video) to the new model ──
  await sb.from('product_images').delete().eq('product_id', pid)
  let n = 0, videoUrl = null
  for (const folder of FOLDERS) {
    if (!fs.existsSync(folder)) continue
    for (const f of fs.readdirSync(folder).sort()) {
      const full = path.join(folder, f)
      if (/\.jpe?g$/i.test(f)) {
        const url = await uploadFile(full, `rozil/arabic-${pid}-${n}.jpg`, 'image/jpeg')
        if (url) { await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++ }
      } else if (/\.mp4$/i.test(f) && !videoUrl) {
        videoUrl = await uploadFile(full, `rozil/arabic-${pid}.mp4`, 'video/mp4')
      }
    }
  }
  if (videoUrl) await sb.from('products').update({ video_url: videoUrl }).eq('id', pid)
  console.log(`Attached ${n} images${videoUrl ? ' + 1 video' : ''} to the Arabic-Perfume model`)

  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', ROZIL)
  console.log('Rozil total products:', count)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
