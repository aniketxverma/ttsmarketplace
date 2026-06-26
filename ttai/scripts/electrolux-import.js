require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '3a25e3d0-acb8-499c-bdd7-c744d3ad63d7' // Tehnomag
const CAT = '6c8be190-b0dc-4907-870a-e6f190ac2a81'
const XLS = 'C:/Users/anike/Downloads/ELECTROLUX AC offer 2026.xlsx'
const DIR = 'C:/tmp/elx'
const clean = (s) => String(s ?? '').replace(/\r/g, '').replace(/\s+/g, ' ').trim()
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'

async function main() {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLS).Sheets['ELECTROLUX'], { header: 1, defval: '' })
  const rowToProduct = {}
  let ok = 0
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i]
    const id = clean(r[0]); const modelFull = String(r[1] ?? '').replace(/\r/g, '')
    const ean = (clean(r[2]).split(/\s+/)[0].match(/\d{8,14}/) || [])[0] || null
    const desc = clean(r[4]); const price = parseFloat(r[5]); const stock = parseInt(r[6])
    if (!modelFull.trim() || isNaN(price) || price <= 0) continue
    const name = clean(modelFull.split('\n')[0]).slice(0, 140)

    const row = {
      supplier_id: SUP, category_id: CAT, marketplace_context: 'wholesale',
      name, slug: slugify(`${name}-${id || ean}`),
      brand_name: 'Electrolux', product_line: 'Air Conditioners',
      sku: id || null, ean: ean ? ean.slice(0, 40) : null,
      description: `${clean(modelFull)}\n\n${desc}\n\nEXW Zagreb. B2B wholesale. IVA 21%.`,
      specs: { Brand: 'Electrolux', Model: name, EAN: clean(r[2]), Category: 'Air Conditioners', Terms: 'EXW Zagreb' },
      price_cents: Math.round(price * 100), exw_price_cents: Math.round(price * 100),
      retail_price_cents: null, vat_rate: 21, currency_code: 'EUR',
      sell_piece: false, sell_box: true, sell_pallet: true, sell_truck: true,
      min_order_qty: 1, stock_qty: !isNaN(stock) ? stock : 100, is_published: true,
      country_of_origin: 'Imported', lead_time: 'Stock · EXW Zagreb',
    }
    const ins = await sb.from('products').insert(row).select('id').single()
    if (ins.error) { console.log('  err', name, ins.error.message); continue }
    rowToProduct[i] = ins.data.id; ok++
  }
  console.log('Electrolux products inserted:', ok)

  // images
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
    const productRows = Object.keys(rowToProduct).map(Number).sort((a, b) => a - b)
    const byPid = new Map()
    for (const a of anchors) {
      let pr = null; for (const r of productRows) { if (r <= a.row) pr = r; else break }
      if (pr == null) pr = productRows[0]
      const pid = rowToProduct[pr]
      if (!byPid.has(pid)) byPid.set(pid, [])
      if (!byPid.get(pid).includes(a.file)) byPid.get(pid).push(a.file)
    }
    for (const [pid, files] of byPid) {
      await sb.from('product_images').delete().eq('product_id', pid)
      let n = 0
      for (const f of files.slice(0, 5)) {
        const buf = fs.readFileSync(path.join(DIR, f))
        const dest = `electrolux/${pid}-${n}.${f.split('.').pop()}`
        const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(f), upsert: true })
        if (up.error) { console.log('  img err', up.error.message); continue }
        const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
        await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
      }
      if (n > 0) attached++
    }
  } catch (e) { console.log('image step err:', e.message) }
  console.log(`Done — Electrolux listings with images: ${attached}`)
}
main().catch((e) => console.log('ERR', e.message))
