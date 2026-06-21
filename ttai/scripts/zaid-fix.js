require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const DUP = 'b35559cd-3ba7-43ac-b917-9f515901b32f' // the new "Zaid" supplier created by mistake
const FILE = 'C:/Users/anike/Downloads/Zaid (3).xlsx'

const norm = (s) => String(s ?? '').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const catId = async (slug) => (await sb.from('categories').select('id').eq('slug', slug).single()).data?.id

async function wipeProducts(supplierId) {
  const { data: ps } = await sb.from('products').select('id').eq('supplier_id', supplierId)
  const ids = (ps ?? []).map((p) => p.id)
  if (!ids.length) return 0
  await sb.from('product_images').delete().in('product_id', ids)
  const del = await sb.from('products').delete().in('id', ids)
  if (del.error) { console.log('  wipe err', del.error.message); return -1 }
  return ids.length
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

async function main() {
  // 1) Remove the duplicate "Zaid" supplier I created by mistake
  const wiped = await wipeProducts(DUP)
  const delSup = await sb.from('suppliers').delete().eq('id', DUP)
  console.log(delSup.error ? `Dup delete err: ${delSup.error.message}` : `Deleted duplicate Zaid supplier (+${wiped} products)`)

  // 2) Reactivate + refresh the real (old) supplier: Nordic Snacks
  const { data: SUPROW } = await sb.from('suppliers').select('id, trade_name').eq('brand_slug', 'nordic-snacks').single()
  if (!SUPROW) { console.log('Nordic Snacks not found — abort'); return }
  const SUP = SUPROW.id
  await sb.from('suppliers').update({
    status: 'ACTIVE',
    about_company: 'Wholesale importer of American & Mexican snacks, candy, hot sauces and energy drinks — Tajin, Hi Chew, Herr\'s, Jerki, MacHeaven, Valentina, OGO, Hell and more. Prices are DDP (Delivered Duty Paid) in EUR by the case (Hell brand is EX). Some products carry country sales restrictions (shown on each listing).',
  }).eq('id', SUP)

  const refreshed = await wipeProducts(SUP)
  console.log(`Refreshing ${SUPROW.trade_name} (cleared ${refreshed} old products)…`)

  const CAT = await catId('food-bakery')
  const RED = new Set(['TAJIN', 'HI CHEW', "HERR'S", 'JERKI'])
  const EX = new Set(['HELL', 'HELLL'])
  const fixBrand = (b) => b.replace(/^Helll$/i, 'Hell').replace(/^Unlce Jim$/i, 'Uncle Jim')

  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets['Blad1'], { header: 1, defval: '' })
  let brand = '', ok = 0
  for (let i = 7; i < rows.length; i++) {
    const r = rows[i]
    const bRaw = norm(r[3]); const name = norm(r[4]); const upc = r[5]; const vol = r[6]; const unit = norm(r[7]); const price = parseFloat(r[8])
    if (name === 'Product name' || bRaw === 'Brand') continue
    if (bRaw && !/^Kolumn/i.test(bRaw)) brand = fixBrand(bRaw)
    if (!name || isNaN(price) || price <= 0) continue
    const B = brand.toUpperCase()
    const incoterm = EX.has(B) ? 'EX-Works' : 'DDP (Delivered Duty Paid)'
    const noSpain = RED.has(B)
    const ruleLine = noSpain
      ? '⚠ NOT for sale in Spain. Can be sold to other markets.'
      : 'Sales restricted to Spain & Africa only — not to other EU countries.'
    const id = await insertProduct({
      supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
      name: `${brand} ${name}`.replace(/\s+/g, ' ').slice(0, 140).trim(),
      slug: slugify(`${brand}-${name}`) + '-' + Math.random().toString(36).slice(2, 6),
      brand_name: brand, product_line: brand,
      net_content: vol ? `${vol} ${unit}` : null, units_per_carton: parseInt(upc) || null,
      description: `${brand} ${name} — ${vol}${unit ? ' ' + unit : ''}, ${upc} units/case. Wholesale by the case (EUR).\nIncoterm: ${incoterm}.\n${ruleLine}`,
      specs: { Incoterm: incoterm, 'Sales restriction': noSpain ? 'Not for Spain' : 'Spain & Africa only', 'Units per case': upc, 'Net content': vol ? `${vol} ${unit}` : '' },
      price_cents: Math.round(price * 100), currency_code: 'EUR',
      min_order_qty: 1, stock_qty: 100, lead_time: 'DDP · ready', is_published: true, country_of_origin: 'Imported',
    })
    if (id) ok++
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`${SUPROW.trade_name}: ${count} products (inserted ${ok}), status ACTIVE`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
