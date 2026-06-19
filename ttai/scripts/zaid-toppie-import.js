require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const SE = 'c8340b75-0631-4008-8c6b-298916e58478'
const FR = 'cca02635-903e-4ea3-a123-94fd9bd6a394'
const IMG_DIR = 'C:/Users/anike/Downloads/Images'
const ZAID = 'C:/Users/anike/Downloads/Zaid.xlsx'
const TOPPIE = 'C:/Users/anike/Downloads/Toppie DVD STOCK - LOGISTIC info.xlsx'

const norm = (s) => String(s ?? '').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const catId = async (slug) => (await sb.from('categories').select('id').eq('slug', slug).single()).data?.id

async function ensureSupplier(row) {
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', `%${row.legal_name}%`).maybeSingle()
  if (!sup) {
    let ins = await sb.from('suppliers').insert(row).select('id').single()
    if (ins.error) { const r = { ...row }; delete r.badges; ins = await sb.from('suppliers').insert(r).select('id').single() }
    sup = ins.data; console.log(row.trade_name, 'created')
  } else {
    const upd = { ...row }; delete upd.legal_name
    let r = await sb.from('suppliers').update(upd).eq('id', sup.id)
    if (r.error) { delete upd.badges; await sb.from('suppliers').update(upd).eq('id', sup.id) }
    console.log(row.trade_name, 'updated')
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

async function uploadLocal(file, dest) {
  const buf = fs.readFileSync(file)
  const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: 'image/jpeg', upsert: true })
  if (up.error) { console.log('  img err', up.error.message); return null }
  return sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
}

// ── TOPPIE (France) — candy, price on request, real photos ──
async function toppie() {
  const CAT = await catId('food-sweets')
  const SUP = await ensureSupplier({
    legal_name: 'Toppie', trade_name: 'Toppie', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: FR, tax_id: 'FR-TOPPIE', brand_slug: 'toppie', reliability_tier: 'SILVER',
    tagline: 'Toppie Wax Candy & Crystal Candy — novelty confectionery (France)',
    about_company: 'Toppie is a French novelty confectionery brand — Wax Candy (crunchy wax, jelly liquid inside) and Crystal Candy (gem-shaped soft candy). Sold by display & master case for retail and wholesale across Europe.',
    description: 'Toppie Wax Candy & Crystal Candy — novelty sweets, wholesale from France.',
    badges: ['France Supplier', 'Confectionery', 'Wholesale'],
  })
  // image map by product keyword → local files
  const IMG = {
    'aqua aura': ['WhatsApp Image 2026-06-18 at 22.38.51.jpeg', 'WhatsApp Image 2026-06-18 at 22.38.59.jpeg'],
    'amber cola': ['WhatsApp Image 2026-06-18 at 22.39.04.jpeg', 'WhatsApp Image 2026-06-18 at 22.39.14.jpeg'],
    'rose quartz': ['WhatsApp Image 2026-06-18 at 22.39.21.jpeg', 'WhatsApp Image 2026-06-18 at 22.39.25.jpeg'],
    'astronaut': ['WhatsApp Image 2026-06-18 at 22.39.33.jpeg'],
  }
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(TOPPIE).Sheets['info'], { header: 1, defval: '' })
  let range = '', ok = 0
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i]; const rng = norm(r[0]); const name = norm(r[2]); const ean = norm(r[3])
    if (rng) range = rng.replace(/\/.*$/, '').trim().replace(/\b\w/g, (c) => c.toUpperCase()) // "WAX CANDY" → "Wax Candy"
    if (!name) continue
    const unitsDisplay = r[6], dispCase = r[7], casePallet = r[8]
    const line = /crystal/i.test(range) ? 'Crystal Candy' : /wax/i.test(range) ? 'Wax Candy' : (range || 'Toppie')
    const id = await insertProduct({
      supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
      name: name.slice(0, 140), slug: slugify(name) + '-' + (ean ? String(ean).slice(-5) : Math.random().toString(36).slice(2, 6)),
      brand_name: 'Toppie', product_line: line, ean: ean ? String(ean).slice(0, 40) : null,
      description: `${name} — Toppie ${line}. Wholesale by display & master case.\nUnits/display: ${unitsDisplay} · Displays/master case: ${dispCase} · Master cases/pallet: ${casePallet}.`,
      price_cents: 0, price_on_request: true, currency_code: 'EUR',
      min_order_qty: 1, units_per_carton: parseInt(unitsDisplay) || null, stock_qty: 100,
      lead_time: 'Ready to Ship', is_published: true, country_of_origin: 'EU',
    })
    if (id) {
      ok++
      const key = Object.keys(IMG).find((k) => name.toLowerCase().includes(k))
      if (key) {
        let n = 0
        for (const f of IMG[key]) { const url = await uploadLocal(path.join(IMG_DIR, f), `toppie/${id}-${n}.jpg`); if (url) { await sb.from('product_images').insert({ product_id: id, url, sort_order: n }); n++ } }
      }
    }
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('Toppie products:', count, '(inserted', ok + ')')
}

// ── NORDIC SNACKS (Sweden / "Zaid" pricelist) — DDP, country rules ──
async function nordic() {
  const CAT = await catId('food-bakery')
  const SUP = await ensureSupplier({
    legal_name: 'Nordic Snacks Import', trade_name: 'Nordic Snacks', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: SE, tax_id: 'SE-NORDIC', brand_slug: 'nordic-snacks', reliability_tier: 'SILVER',
    tagline: 'American & Mexican snacks, candy & hot sauces — wholesale (Sweden, DDP)',
    about_company: 'Nordic Snacks is a Sweden-based importer and wholesaler of American & Mexican snacks, candy and hot sauces — Tajin, Hi Chew, Herr\'s, Jerki, OGO, Hell and more. Prices are DDP (Delivered Duty Paid) in EUR (Hell brand is EX). Note: some products carry country sales restrictions (shown on each listing).',
    description: 'American & Mexican snacks, candy & hot sauces — wholesale by the case from Sweden.',
    badges: ['Sweden Supplier', 'Import Snacks & Candy', 'Wholesale', 'DDP'],
  })
  const RED = new Set(['TAJIN', 'HI CHEW', "HERR'S", 'JERKI'])           // red text → NOT for Spain
  const EX = new Set(['HELL', 'HELLL'])                                  // EX price (others DDP)
  const fixBrand = (b) => b.replace(/^Helll$/i, 'Hell').replace(/^Unlce Jim$/i, 'Uncle Jim')

  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(ZAID).Sheets['Blad1'], { header: 1, defval: '' })
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
  console.log('Nordic Snacks products:', count, '(inserted', ok + ')')
}

async function main() { await toppie(); await nordic(); console.log('DONE') }
main().catch((e) => console.log('ERR', e.message))
