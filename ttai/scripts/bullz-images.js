require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '3f1b654e-fbcb-48a5-8a4f-6797f1a95778'
const PID = 'e205092c-4ad6-4dc5-aafb-3da49518873b'
const DIR = 'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-22 at 13.29.33'

// Curated best shots: 3-flavour composite first (main), then neon hero renders, then real case photos.
const PICK = [
  'WhatsApp Image 2026-06-22 at 13.26.32.jpeg',
  'WhatsApp Image 2026-06-22 at 13.26.32 (1).jpeg',
  'WhatsApp Image 2026-06-22 at 13.18.54.jpeg',
  'WhatsApp Image 2026-06-22 at 13.18.55.jpeg',
  'WhatsApp Image 2026-06-22 at 13.18.56.jpeg',
  'WhatsApp Image 2026-06-22 at 13.18.57.jpeg',
  'WhatsApp Image 2026-06-22 at 13.24.51.jpeg',
  'WhatsApp Image 2026-06-22 at 13.24.52.jpeg',
  'WhatsApp Image 2026-06-22 at 13.26.33.jpeg',
]

async function main() {
  // Update brand + product with confirmed flavours
  await sb.from('suppliers').update({
    about_company: 'Bullz energy drink (250 ml) — vitamins & caffeine, made in Spain (www.bullz.es). Three flavours: Classic, Acid Pop and Piña & Coco. Sold by the case of 24 (mixed colours allowed) wholesale by box & pallet, and retail in the Shopping Mall.',
    description: 'Bullz energy drink 250 ml — Classic · Acid Pop · Piña & Coco. 24 per case. Wholesale + retail.',
  }).eq('id', SUP)
  await sb.from('products').update({
    name: 'Bullz Energy Drink 250ml — Classic · Acid Pop · Piña & Coco',
    description: 'Bullz energy drink — 250 ml, vitamins & caffeine (www.bullz.es). 3 sabores: Classic (azul), Acid Pop (rojo) y Piña & Coco (naranja). Caja mixta permitida.\n\nB2B (EXW, ex-IVA): €0,25/ud → caja (24 uds) €6,00 · palé (90 cajas / 2.160 uds) €540. IVA 21% en España · 0% fuera.\nShop Online (público): €0,65/ud (IVA incluido). Pedido mínimo: 24 uds (1 caja por modelo).',
    specs: { Brand: 'Bullz', 'Net content': '250 ml', Flavours: 'Classic, Acid Pop, Piña & Coco', 'Units per box': '24', 'Boxes per pallet': '90', 'Mixed box': 'Yes' },
  }).eq('id', PID)

  await sb.from('product_images').delete().eq('product_id', PID)
  let n = 0
  for (const f of PICK) {
    const full = path.join(DIR, f)
    if (!fs.existsSync(full)) { console.log('  missing', f); continue }
    const buf = fs.readFileSync(full)
    const dest = `bullz/${PID}-${n}.jpg`
    const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: 'image/jpeg', upsert: true })
    if (up.error) { console.log('  img err', up.error.message); continue }
    const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
    await sb.from('product_images').insert({ product_id: PID, url, sort_order: n }); n++
  }
  console.log(`Bullz: attached ${n} curated images + confirmed 3 flavours`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
