require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ROZIL = '43d90c96-3284-4f12-9db4-5e956fd4829b'

// Retail is "all-including" (VAT inside). Platform adds 21% in Spain, so we store
// the ex-VAT base = allInPrice / 1.21 so the final shown total matches Tai's number.
const exVat = (allIn) => Math.round((allIn / 1.21) * 100)

async function main() {
  // ── Standard 2.8L line (4 pcs/box) — all units_per_carton=4 SKUs ──
  // B2B per pc (ex-VAT): box €2.10 · pallet €1.85 · truck €1.59.
  // Retail all-in €14.50/box of 4 → €3.625/pc all-in → €3.00/pc ex-VAT.
  const UPC = 4, CPP = 60, PPT = 33, palletPcs = UPC * CPP, truckPcs = UPC * CPP * PPT
  const std = await sb.from('products').update({
    price_cents: 210,
    price_per_box_cents: Math.round(2.10 * UPC * 100),
    price_per_pallet_cents: Math.round(1.85 * palletPcs * 100),
    price_per_truck_cents: Math.round(1.59 * truckPcs * 100),
    retail_price_cents: exVat(14.50 / UPC),   // €3.00/pc ex-VAT
    cartons_per_pallet: CPP, pallets_per_truck: PPT, vat_rate: 21,
  }).eq('supplier_id', ROZIL).eq('units_per_carton', 4).select('id')
  console.log(std.error ? 'std err: ' + std.error.message : `Standard 2.8L line repriced (${std.data.length} SKUs): box €2.10 / pallet €1.85 / truck €1.59, retail €14.50/box all-in`)

  // ── Dishwasher 5L (3 pcs/box) ──
  // Wholesale €2.75/pc (ex-VAT). Retail all-in €5.99/pc → €18/box of 3.
  const DUPC = 3, Dpallet = DUPC * CPP, Dtruck = DUPC * CPP * PPT
  const dish = await sb.from('products').update({
    name: 'Rozil Lavavajillas 5L',
    net_content: '5 L', units_per_carton: DUPC, cartons_per_pallet: CPP, pallets_per_truck: PPT,
    price_cents: 275,
    price_per_box_cents: Math.round(2.75 * DUPC * 100),
    price_per_pallet_cents: Math.round(2.75 * Dpallet * 100),
    price_per_truck_cents: Math.round(2.75 * Dtruck * 100),
    retail_price_cents: exVat(5.99),          // €4.95/pc ex-VAT → €5.99 all-in
    vat_rate: 21, min_box_qty: 1, min_pallet_qty: 1, min_truck_qty: 1,
    sell_piece: true, sell_box: true, sell_pallet: true, sell_truck: true,
    description: 'Rozil Lavavajillas (lavavajillas a mano) 5 L.\n\nB2B (EXW, ex-IVA): €2,75/ud al por mayor.\n1 caja = 3 uds · 1 palé = 60 cajas (180 uds) · 1 camión = 33 palés (5.940 uds).\nIVA 21% en España · 0% fuera de España.\nVenta al público: €5,99/ud (IVA incluido) — mínimo 1 caja de 3 uds = €18,00.',
  }).eq('supplier_id', ROZIL).ilike('name', '%Lavavajillas%').select('id')
  console.log(dish.error ? 'dish err: ' + dish.error.message : `Dishwasher 5L repriced (${dish.data?.length || 0}): €2.75/pc wholesale, €5.99/pc retail`)

  // Verify
  const { data } = await sb.from('products').select('name,units_per_carton,price_per_box_cents,price_per_pallet_cents,price_per_truck_cents,retail_price_cents').eq('supplier_id', ROZIL).order('units_per_carton')
  console.log('\nSample:')
  data.slice(0, 4).concat(data.filter(d => /Lavavajillas|Perfume/.test(d.name))).forEach(d =>
    console.log(' ', d.name.slice(0, 34).padEnd(35), `box/pc €${(d.price_per_box_cents / d.units_per_carton / 100).toFixed(2)} · pallet/pc €${(d.price_per_pallet_cents / (d.units_per_carton * 60) / 100).toFixed(2)} · truck/pc €${(d.price_per_truck_cents / (d.units_per_carton * 60 * 33) / 100).toFixed(2)} · retail/pc €${(d.retail_price_cents / 100).toFixed(2)} ex-VAT`))
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
