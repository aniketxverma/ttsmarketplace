// XO catalogue importer — one sheet at a time.
// Usage: node scripts/xo-import.js "<Sheet Name>" <category-slug>
// Inserts products (price = EXW USD * 0.92 EUR * 1.03 markup) then attaches the
// sheet's embedded Excel photos (matched by drawing anchor row + photo column).
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const SUP = '27a2fb73-4c89-4825-aa91-b3c20aaf97a8' // XO Global
const XLSX_PATH = 'C:/Users/anike/Downloads/XO Updated Price List compressed 0429.xlsx'
const DIR = 'C:/Users/anike/xo_x' // unzipped workbook
const EUR = 0.92, MARKUP = 1.03

const norm = s => String(s || '').replace(/\s+/g, ' ').trim()
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

async function main() {
  const sheetName = process.argv[2]
  const catSlug = process.argv[3]
  if (!sheetName || !catSlug) { console.log('usage: node scripts/xo-import.js "<Sheet>" <cat-slug>'); return }

  const { data: cat } = await sb.from('categories').select('id').eq('slug', catSlug).single()
  if (!cat) { console.log('category not found:', catSlug); return }
  const CAT = cat.id

  const wb = XLSX.readFile(XLSX_PATH)
  const sheetIdx = wb.SheetNames.indexOf(sheetName)
  if (sheetIdx < 0) { console.log('sheet not found:', sheetName); return }
  const sheetFile = `sheet${sheetIdx + 1}.xml`

  // resolve this sheet's drawing file
  const wsRels = fs.readFileSync(`${DIR}/xl/worksheets/_rels/${sheetFile}.rels`, 'utf8')
  const drawTarget = (wsRels.match(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/) || [])[1]

  // header columns
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
  let hr = -1
  for (let i = 0; i < 10; i++) { if (rows[i] && rows[i].some(c => /barcode/i.test(String(c)))) { hr = i; break } }
  const H = rows[hr].map(norm)
  const find = re => H.findIndex(h => re.test(h))
  const ci = {
    name: find(/product.?s? name/i), ean: find(/barcode/i), usd: find(/USD/i),
    color: find(/^color$/i), cap: find(/capacity/i), desc: find(/description/i),
    photo: find(/product\s*photo/i), pkg: find(/package\s*photo/i),
  }

  // drawing anchors → row→file for the product-photo column (and package as fallback)
  const rowImgP = {}, rowImgK = {}
  if (drawTarget) {
    const rels = fs.readFileSync(`${DIR}/xl/drawings/_rels/${drawTarget}.rels`, 'utf8')
    const ridFile = {}; let m; const rre = /Id="(rId\d+)"[^>]*Target="\.\.\/media\/([^"]+)"/g
    while ((m = rre.exec(rels))) ridFile[m[1]] = m[2]
    const dxml = fs.readFileSync(`${DIR}/xl/drawings/${drawTarget}`, 'utf8')
    for (const b of dxml.split('<xdr:twoCellAnchor').slice(1)) {
      const from = (b.match(/<xdr:from>([\s\S]*?)<\/xdr:from>/) || [])[1] || ''
      const col = Number((from.match(/<xdr:col>(\d+)<\/xdr:col>/) || [])[1])
      const row = Number((from.match(/<xdr:row>(\d+)<\/xdr:row>/) || [])[1])
      const rid = (b.match(/r:embed="(rId\d+)"/) || [])[1]
      if (!ridFile[rid]) continue
      if (col === ci.photo && rowImgP[row] === undefined) rowImgP[row] = ridFile[rid]
      if (col === ci.pkg && rowImgK[row] === undefined) rowImgK[row] = ridFile[rid]
    }
  }

  // parse products + per-product image
  const items = []; let cur = { name: '', price: 0, desc: '' }; let lastImg = null; const seen = new Set()
  for (let i = hr + 1; i < rows.length; i++) {
    const r = rows[i]
    const name = norm(r[ci.name]); const ean = String(r[ci.ean] || '').replace(/\D/g, '')
    const usd = r[ci.usd]; const hasP = usd !== '' && !isNaN(Number(usd))
    const color = norm(r[ci.color]); const cap = ci.cap >= 0 ? norm(r[ci.cap]) : ''; const desc = norm(r[ci.desc])
    const imgP = rowImgP[i]
    if (name) { cur.name = name; if (hasP) cur.price = Number(usd); if (desc) cur.desc = desc; lastImg = imgP || null }
    else { if (hasP) cur.price = Number(usd); if (desc) cur.desc = desc; if (imgP) lastImg = imgP }
    if (ean.length >= 12 && ean.length <= 14 && !seen.has(ean)) {
      const price = hasP ? Number(usd) : cur.price
      if (cur.name && price) {
        seen.add(ean)
        const capClean = (cap && !/^USB/i.test(cap)) ? cap : ''
        const title = [cur.name, capClean, color].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
        const exw = Math.round(price * EUR * 100)
        items.push({
          row: i, ean, img: imgP || lastImg || rowImgK[i] || null,
          rec: {
            supplier_id: SUP, category_id: CAT, marketplace_context: 'both',
            name: title.slice(0, 140), slug: slugify(title) + '-' + ean.slice(-5),
            description: (cur.desc || '').slice(0, 600),
            price_cents: Math.round(exw * MARKUP), exw_price_cents: exw,
            currency_code: 'EUR', min_order_qty: 1, stock_qty: 0, is_published: true,
            ean, brand_name: 'XO', product_line: cur.name.slice(0, 80), country_of_origin: 'China',
          },
        })
      }
    }
  }
  console.log(`${sheetName}: parsed ${items.length} | with image ${items.filter(p => p.img).length}`)

  // insert products
  let ins = 0
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50).map(x => x.rec)
    const { error } = await sb.from('products').insert(batch)
    if (error) { console.log('insert err @' + i, error.message); break }
    ins += batch.length
  }
  console.log('inserted:', ins)

  // attach images
  const { data: dbp } = await sb.from('products').select('id,ean').eq('supplier_id', SUP)
  const byEan = {}; for (const p of dbp) byEan[p.ean] = p.id
  const fileUrl = {}; let done = 0, fail = 0
  for (const it of items) {
    const pid = byEan[it.ean]; if (!pid || !it.img) continue
    if (!fileUrl[it.img]) {
      try {
        const buf = fs.readFileSync(`${DIR}/xl/media/${it.img}`)
        const ext = it.img.split('.').pop()
        const path = 'products/xo/' + it.img
        const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: true })
        if (up.error) { fail++; continue }
        fileUrl[it.img] = sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
      } catch { fail++; continue }
    }
    await sb.from('product_images').insert({ product_id: pid, url: fileUrl[it.img], sort_order: 0 })
    done++
  }
  console.log('images attached:', done, '| fails:', fail)
}
main().catch(e => console.log('ERR', e.message))
