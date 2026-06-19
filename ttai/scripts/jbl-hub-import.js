require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const NL = 'e8c1b027-cde1-43cb-84fb-5ba1eaaca6ed'
const CAT_AUDIO = '1da91c9c-f225-431b-afb4-56dc77e4274c'        // Audio & Headphones
const CAT_ACC = '6ec56578-dee3-438f-9eda-15cbb944dd81'          // Mobile Accessories
const FILE = 'C:/Users/anike/Downloads/Blister Pricelist 15-06-2026.xlsx'

const norm = (s) => String(s ?? '').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const titleBrand = (s) => ({ GOOGLE: 'Google', JBL: 'JBL', KODAK: 'Kodak', MARSHALL: 'Marshall', SAMSUNG: 'Samsung', APPLE: 'Apple', XIAOMI: 'Xiaomi', ZTE: 'ZTE', KINGSTON: 'Kingston' }[s.toUpperCase()] ?? s)
// Chargers / cables / storage → accessories; everything else (headphones, earbuds,
// speakers) → audio, which is this supplier's core line.
const catFor = (name) => /charger|cable|adapter|power ?bank|kingston|micro ?sd|sd ?card|\busb\b|memory|storage|card reader/i.test(name) ? CAT_ACC : CAT_AUDIO

async function insertProduct(row) {
  let ins = await sb.from('products').insert(row).select('id').single()
  if (ins.error && /column|does not exist/i.test(ins.error.message)) {
    const o = { ...row };['product_line', 'ean', 'lead_time', 'price_on_request', 'brand_name'].forEach((k) => delete o[k])
    ins = await sb.from('products').insert(o).select('id').single()
  }
  if (ins.error) { console.log('  err', row.name, ins.error.message); return null }
  return ins.data.id
}

async function main() {
  // ── Supplier: JBL Hub (Netherlands — JBL & multimedia wholesale) ──
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%JBL Hub%').maybeSingle()
  const supRow = {
    legal_name: 'JBL Hub', trade_name: 'JBL Hub', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: NL, tax_id: 'NL-JBLHUB', brand_slug: 'jbl-hub',
    reliability_tier: 'SILVER',
    tagline: 'JBL, Marshall, Samsung & Xiaomi audio + multimedia — wholesale (Netherlands)',
    about_company: 'JBL Hub is a Netherlands-based wholesale distributor specialising in JBL and multimedia audio — headphones, earbuds and speakers — plus accessories from Marshall, Samsung, Xiaomi, Google, Apple and Kingston. Blister-packed retail stock, ready to ship across Europe.',
    description: 'JBL & multimedia audio + accessories — blister retail packs, wholesale from the Netherlands.',
    badges: ['Netherlands Supplier', 'Audio & Multimedia', 'Wholesale', 'Blister Retail Pack'],
  }
  if (!sup) {
    let ins = await sb.from('suppliers').insert(supRow).select('id').single()
    if (ins.error) { delete supRow.badges; ins = await sb.from('suppliers').insert(supRow).select('id').single() }
    sup = ins.data; console.log('supplier created')
  } else {
    const upd = { ...supRow }; delete upd.legal_name
    let r = await sb.from('suppliers').update(upd).eq('id', sup.id)
    if (r.error) { delete upd.badges; await sb.from('suppliers').update(upd).eq('id', sup.id) }
    console.log('supplier updated')
  }
  const SUP = sup.id

  // ── Parse pricelist: brand section headers + product rows ──
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets['Sheet1'], { header: 1, defval: '' })
  let brand = ''
  const items = []
  for (let i = 1; i < rows.length; i++) {
    const name = norm(rows[i][0]); const ean = norm(rows[i][1]); const priceRaw = rows[i][2]
    if (name === 'PRODUCT') continue
    if (name && !ean && (priceRaw === '' || priceRaw === null)) { brand = titleBrand(name); continue } // section header
    if (!name) continue
    const price = parseFloat(String(priceRaw).replace(',', '.'))
    if (isNaN(price) || price <= 0) continue
    const avail = norm(rows[i][3]).toLowerCase()
    const incoming = avail.includes('incoming')
    const ean1 = ean.split('/')[0].replace(/\D/g, '').slice(0, 40) || null
    const full = `${brand} ${name}`.replace(/\s+/g, ' ').trim()
    items.push({
      supplier_id: SUP, category_id: catFor(name), marketplace_context: 'both',
      name: full.slice(0, 140), slug: slugify(full) + '-' + (ean1 ? ean1.slice(-5) : Math.random().toString(36).slice(2, 6)),
      brand_name: brand, product_line: brand, ean: ean1,
      description: `${full} — blister retail pack. Wholesale from the Netherlands.${incoming ? '\nStatus: Incoming (pre-order).' : ''}`,
      price_cents: Math.round(price * 100), currency_code: 'EUR',
      min_order_qty: 1, stock_qty: incoming ? 0 : 100,
      lead_time: incoming ? 'Incoming · pre-order' : 'Ready to Ship',
      is_published: true, country_of_origin: 'EU',
    })
  }
  console.log('parsed products:', items.length)

  let ok = 0
  for (const it of items) { if (await insertProduct(it)) ok++ }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('INSERTED:', ok, '| JBL Hub total products:', count)
  // family breakdown
  const { data: byb } = await sb.from('products').select('product_line').eq('supplier_id', SUP)
  const fam = {}; for (const p of byb) fam[p.product_line] = (fam[p.product_line] || 0) + 1
  console.log('Families:', JSON.stringify(fam))
}
main().catch((e) => console.log('ERR', e.message))
