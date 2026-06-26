require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const ES = 'b8b14802-20f2-4292-86cc-a34198b39384'
const CAT = '6c8be190-b0dc-4907-870a-e6f190ac2a81' // Electronics & Technology
const XLS = 'C:/Users/anike/Downloads/TM cooling mix offer 26.06.2025.xlsx'
const DIR = 'C:/tmp/tmx'
const clean = (s) => String(s ?? '').replace(/\r/g, '').replace(/\s+/g, ' ').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'

function lineFor(brand, model) {
  const s = `${brand} ${model}`.toLowerCase()
  if (/split/.test(s)) return 'Split Air Conditioners'
  if (/fan/.test(s)) return 'Fans'
  if (/portable|btu|mobil|pac|kw/.test(s)) return 'Portable Air Conditioners'
  return 'Cooling'
}

async function ensureSupplier() {
  let { data: sup } = await sb.from('suppliers').select('id').eq('brand_slug', 'tm-cooling').maybeSingle()
  if (sup) { console.log('TM Cooling exists', sup.id); return sup.id }
  const ins = await sb.from('suppliers').insert({
    legal_name: 'TM Cooling', trade_name: 'TM Cooling', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'wholesale', country_id: ES, brand_slug: 'tm-cooling', reliability_tier: 'SILVER', tax_id: 'TM-COOLING',
    tagline: 'TM Cooling — multi-brand cooling wholesale (portable AC, split systems & fans)',
    about_company: 'TM Cooling — B2B wholesale offer of cooling appliances from leading brands (CHIGO, Zilan, Digitech, Hisense, Beper, FUEGO and more): portable air conditioners, split systems and fans. EXW pricing, stock & fast ETA. Summer 2026 mix offer.',
    description: 'Multi-brand cooling wholesale — portable AC, split systems & fans. EXW, B2B.',
  }).select('id').single()
  if (ins.error) { console.log('supplier err', ins.error.message); process.exit(1) }
  console.log('TM Cooling CREATED', ins.data.id)
  return ins.data.id
}

async function main() {
  const SUP = await ensureSupplier()
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLS).Sheets['List1'], { header: 1, defval: '' })

  const rowToProduct = {}
  let ok = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const brandRaw = clean(r[0]); const model = clean(r[1])
    if (!brandRaw && !model) continue
    const brand = brandRaw.replace(/\b(fan|split system)\b/gi, '').replace(/\s+/g, ' ').trim() || brandRaw
    const ean = (clean(r[2]).split('/')[0].match(/\d{8,14}/) || [])[0] || null
    const qty = parseInt(r[3]) || null
    const unit = clean(r[4]) || 'pcs'
    const price = parseFloat(r[5]); const eta = clean(r[6])
    if (isNaN(price) || price <= 0) continue
    const line = lineFor(brandRaw, model)
    const name = `${brand} ${model}`.replace(/\s+/g, ' ').trim().slice(0, 140)

    const row = {
      supplier_id: SUP, category_id: CAT, marketplace_context: 'wholesale',
      name, slug: slugify(`${name}-${ean || i}`),
      brand_name: brand, product_line: line, ean: ean ? ean.slice(0, 40) : null,
      description: `${brandRaw} — ${model}\n\n${ean ? 'EAN: ' + ean + '\n' : ''}EXW price. ETA: ${eta || 'on request'}. Venta B2B mayorista. IVA 21%.`,
      specs: { Brand: brand, Model: model, EAN: ean || '', Category: line, Unit: unit, ETA: eta || '', Terms: 'EXW' },
      price_cents: Math.round(price * 100), exw_price_cents: Math.round(price * 100),
      retail_price_cents: null, vat_rate: 21, currency_code: 'EUR',
      sell_piece: false, sell_box: true, sell_pallet: true, sell_truck: true,
      min_order_qty: 1, stock_qty: qty ?? 100, is_published: true,
      country_of_origin: 'Imported', lead_time: eta || 'On request',
    }
    const ins = await sb.from('products').insert(row).select('id').single()
    if (ins.error) { console.log('  err', name, ins.error.message); continue }
    rowToProduct[i] = ins.data.id; ok++
  }
  console.log('Products inserted:', ok)

  // ── Images from drawing anchors ──
  let attached = 0
  try {
    const rels = fs.readFileSync(DIR + '/xl/drawings/_rels/drawing1.xml.rels', 'utf8')
    const rid2 = {}; for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) rid2[m[1]] = m[2].replace('../', 'xl/')
    const draw = fs.readFileSync(DIR + '/xl/drawings/drawing1.xml', 'utf8')
    const anchors = []
    for (const a of draw.matchAll(/<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g)) {
      const blk = a[0]
      const rw = (blk.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/) || [])[1]
      const rid = (blk.match(/r:embed="(rId\d+)"/) || [])[1]
      if (rw != null && rid && rid2[rid]) anchors.push({ row: +rw, file: rid2[rid] })
    }
    const fileCount = {}; anchors.forEach(a => fileCount[a.file] = (fileCount[a.file] || 0) + 1)
    const shared = new Set(Object.entries(fileCount).filter(([, c]) => c > 2).map(([f]) => f))
    const productRows = Object.keys(rowToProduct).map(Number).sort((a, b) => a - b)
    const byPid = new Map()
    for (const a of anchors) {
      if (shared.has(a.file)) continue
      let pr = null; for (const r of productRows) { if (r <= a.row) pr = r; else break }
      if (pr == null) continue
      const pid = rowToProduct[pr]
      if (!byPid.has(pid)) byPid.set(pid, [])
      if (!byPid.get(pid).includes(a.file)) byPid.get(pid).push(a.file)
    }
    for (const [pid, files] of byPid) {
      await sb.from('product_images').delete().eq('product_id', pid)
      let n = 0
      for (const f of files.slice(0, 5)) {
        const buf = fs.readFileSync(path.join(DIR, f))
        const dest = `tm/${pid}-${n}.${f.split('.').pop()}`
        const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(f), upsert: true })
        if (up.error) { console.log('  img err', up.error.message); continue }
        const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
        await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
      }
      if (n > 0) attached++
    }
  } catch (e) { console.log('image step err:', e.message) }

  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`TM Cooling: ${count} products | listings with images: ${attached}`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
