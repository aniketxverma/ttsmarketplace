require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '0b65cf16-7522-447d-857c-3105859672a1'
const FILE = 'C:/Users/anike/Downloads/Price List CMC 2026 For Spain 27.03.2026.xlsx'
const digits = (s) => String(s || '').replace(/\D/g, '')

async function main() {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets['CMC - Table 1'], { header: 1, defval: '' })
  // Build EAN → { pack, price } from the price list
  const byEan = new Map()
  for (const r of rows) {
    const ean = digits(r[0]); const name = String(r[1] || '').trim()
    const pack = parseInt(r[2]); const price = parseFloat(r[5])
    if (ean.length >= 10 && name && name !== 'Item' && !isNaN(pack) && pack > 0 && !isNaN(price) && price > 0) {
      byEan.set(ean, { pack, price, name })
    }
  }
  console.log('Price-list products:', byEan.size)

  // Fetch current Chtaura products
  const { data: prods } = await sb.from('products').select('id, name, ean, units_per_carton').eq('supplier_id', SUP)
  let updated = 0, unmatched = []
  for (const p of (prods || [])) {
    const info = byEan.get(digits(p.ean))
    if (!info) { unmatched.push(p.name); continue }
    const boxCents = Math.round(info.price * 100)              // FOB price = per BOX (USD)
    const pieceCents = Math.round((info.price / info.pack) * 100) // derived per-piece base
    const upd = await sb.from('products').update({
      units_per_carton: info.pack,
      cartons_per_pallet: 90,            // 1 pallet = 90 boxes
      pallets_per_truck: null,
      price_cents: pieceCents,           // per-piece base (for tier math)
      price_per_box_cents: boxCents,     // the real box price
      price_per_pallet_cents: boxCents * 90, // 90 boxes / pallet
      retail_price_cents: null,          // B2B only — no retail price
      sell_piece: false, sell_box: true, sell_pallet: true, sell_truck: false,
      min_order_qty: 1, min_box_qty: 1, min_pallet_qty: 1,
      marketplace_context: 'wholesale',  // wholesale only
      currency_code: 'USD',
    }).eq('id', p.id)
    if (upd.error) { console.log('  err', p.name, upd.error.message); continue }
    updated++
  }
  console.log('Updated:', updated, '| unmatched:', unmatched.length)
  if (unmatched.length) console.log('  unmatched:', unmatched.slice(0, 10).join(' | '))

  // Supplier: min order value 2000, mixed-pallet note
  const { error: sErr } = await sb.from('suppliers').update({
    min_order_value_cents: 200000,       // 2000 minimum order value (product currency)
    marketplace_context: 'wholesale',
    about_company: 'Conserves Modernes Chtaura (CMC) — authentic Lebanese specialties: hummus, baba ghannouj, foul, pickles, jams, rose/orange-blossom water and more. Sold wholesale by the box (units per box as listed) and pallet. 1 pallet = 90 boxes, and pallets can be MIXED (combine different products to build a 90-box pallet). Minimum order value 2,000. Prices FOB (USD).',
  }).eq('id', SUP)
  console.log(sErr ? 'supplier err: ' + sErr.message : 'Supplier: min order 2000 + mixed-pallet note set')

  // Verify a sample
  const { data: chk } = await sb.from('products').select('name, units_per_carton, cartons_per_pallet, price_per_box_cents, price_cents, retail_price_cents, marketplace_context').eq('supplier_id', SUP).limit(3)
  console.log('\nSample:')
  chk.forEach(p => console.log('  ' + p.name.slice(0, 36).padEnd(37), `box(${p.units_per_carton}) $${(p.price_per_box_cents / 100).toFixed(2)} · /pc $${(p.price_cents / 100).toFixed(2)} · pallet=${p.cartons_per_pallet}box · retail=${p.retail_price_cents ?? 'blank'} · ${p.marketplace_context}`))
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
