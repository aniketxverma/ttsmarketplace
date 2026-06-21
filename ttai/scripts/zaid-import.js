require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const SE = 'c8340b75-0631-4008-8c6b-298916e58478'
const FILE = 'C:/Users/anike/Downloads/Zaid (3).xlsx'

const norm = (s) => String(s ?? '').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const catId = async (slug) => (await sb.from('categories').select('id').eq('slug', slug).single()).data?.id

async function ensureSupplier(row) {
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', row.legal_name).maybeSingle()
  if (!sup) {
    let ins = await sb.from('suppliers').insert(row).select('id').single()
    if (ins.error) { const r = { ...row }; delete r.badges; ins = await sb.from('suppliers').insert(r).select('id').single() }
    if (ins.error) { console.log('supplier err', ins.error.message); process.exit(1) }
    sup = ins.data; console.log(row.trade_name, 'CREATED', sup.id)
  } else {
    const upd = { ...row }; delete upd.legal_name
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

async function main() {
  const CAT = await catId('food-bakery')
  const SUP = await ensureSupplier({
    legal_name: 'Zaid', trade_name: 'Zaid', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: SE, tax_id: 'SE-ZAID', brand_slug: 'zaid', reliability_tier: 'SILVER',
    tagline: 'American & Mexican snacks, candy & hot sauces — wholesale (DDP)',
    about_company: 'Zaid is a wholesale importer of American & Mexican snacks, candy, hot sauces and energy drinks — Tajin, Hi Chew, Herr\'s, Jerki, MacHeaven, Valentina, OGO, Hell and more. Prices are DDP (Delivered Duty Paid) in EUR by the case (Hell brand is EX). Some products carry country sales restrictions (shown on each listing).',
    description: 'American & Mexican snacks, candy & hot sauces — wholesale by the case, DDP.',
    badges: ['Import Snacks & Candy', 'Wholesale', 'DDP'],
  })

  const RED = new Set(['TAJIN', 'HI CHEW', "HERR'S", 'JERKI'])  // red text → NOT for Spain
  const EX = new Set(['HELL', 'HELLL'])                          // EX price (others DDP)
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
  console.log('Zaid products:', count, '(inserted', ok + ')')
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
