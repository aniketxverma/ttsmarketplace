require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '3a25e3d0-acb8-499c-bdd7-c744d3ad63d7'
const CAT = '6c8be190-b0dc-4907-870a-e6f190ac2a81' // Electronics & Technology
const XLS = 'C:/Users/anike/Downloads/ELIT COOLING 06-2026 export ES.xlsx'
const DIR = 'C:/tmp/elitx'
const clean = (s) => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
const digits = (s) => String(s ?? '').replace(/\D/g, '')
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'

async function main() {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLS).Sheets['Cooling 2026'], { header: 1, defval: '' })
  const { data: existing } = await sb.from('products').select('id, ean').eq('supplier_id', SUP)
  const byEan = new Map((existing || []).filter(p => p.ean).map(p => [digits(p.ean), p.id]))

  let section = '', ok = 0
  const rowToProduct = {} // excel row -> productId (for image attach)
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i]
    const code = clean(r[0]); const model = clean(r[1]); const ean = digits(r[2])
    const label = clean(r[3]); const spec = clean(r[4]); const ppp = parseInt(r[6]); const price = parseFloat(r[7]); const rrp = parseFloat(r[8]); const stock = parseInt(r[9])
    if (!model && label && isNaN(parseFloat(r[7]))) { section = titleCase(label); continue } // section header
    if (!model || isNaN(price) || price <= 0) continue

    const row = {
      supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
      name: model.slice(0, 140), slug: slugify(`${model}-${code || ean}`),
      brand_name: 'Elit', product_line: section || 'Cooling',
      sku: code || null, ean: ean ? ean.slice(0, 40) : null,
      description: `${spec}\n\n${ppp ? `Uds./palé: ${ppp}\n` : ''}IVA 21%. Refrigeración / ventiladores — verano 2026.`,
      specs: { Brand: 'Elit', Code: code, EAN: ean || '', Category: section, 'Uds/palé': ppp || '', RRP: rrp || '' },
      price_cents: Math.round(price * 100),
      retail_price_cents: !isNaN(rrp) && rrp > 0 ? Math.round(rrp * 100) : null,
      vat_rate: 21, currency_code: 'EUR',
      sell_piece: true, sell_box: false, sell_pallet: true, sell_truck: false,
      min_order_qty: 1, stock_qty: !isNaN(stock) ? stock : 100, is_published: true, country_of_origin: 'Imported', lead_time: 'Ready',
    }
    let pid = ean ? byEan.get(ean) : null
    if (pid) { await sb.from('products').update(row).eq('id', pid) }
    else { const ins = await sb.from('products').insert(row).select('id').single(); if (ins.error) { console.log('  err', model, ins.error.message); continue } pid = ins.data.id }
    rowToProduct[i] = pid; ok++
  }
  console.log('Products upserted:', ok)

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
    // group images by product row (anchor row → nearest product row at or above)
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
        const dest = `elit/${pid}-${n}.${f.split('.').pop()}`
        const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(f), upsert: true })
        if (up.error) { console.log('  img err', up.error.message); continue }
        const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
        await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
      }
      if (n > 0) attached++
    }
  } catch (e) { console.log('image step err:', e.message) }

  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`Elit Cooling: ${count} products | listings with images: ${attached}`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
