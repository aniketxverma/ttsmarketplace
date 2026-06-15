// Second image pass — fill XO products still missing a photo using a wider
// anchor search (nearby rows + package-photo + any photo column).
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const SUP = '27a2fb73-4c89-4825-aa91-b3c20aaf97a8'
const XLSX_PATH = 'C:/Users/anike/Downloads/XO Updated Price List compressed 0429.xlsx'
const DIR = 'C:/Users/anike/xo_x'
const norm = s => String(s || '').replace(/\s+/g, ' ').trim()

const SHEETS = [
  'Memory Card & USB Disk', 'XO selected', 'TWS Series', 'Smart Watch', 'Bluetooth Speaker',
  'Gaming Series', 'Creative Life', 'Wired Earphone', 'Audio', 'power bank', 'USB Cable',
  'Hub & Converter', 'Holder & Car Charger ', 'USB Charger ', 'Wireless Charger',
  'iPhone 17&16&15&14&13 series', 'Screen protector ',
]

function parse(wb, sheetName) {
  const sheetIdx = wb.SheetNames.indexOf(sheetName)
  const wsRels = fs.readFileSync(`${DIR}/xl/worksheets/_rels/sheet${sheetIdx + 1}.xml.rels`, 'utf8')
  const drawTarget = (wsRels.match(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/) || [])[1]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
  let hr = -1
  for (let i = 0; i < 10; i++) { if (rows[i] && rows[i].some(c => /barcode/i.test(String(c)))) { hr = i; break } }
  const H = rows[hr].map(norm); const find = re => H.findIndex(h => re.test(h))
  const ci = { name: find(/product.?s? name/i), ean: find(/barcode/i), photo: find(/product\s*photo/i), pkg: find(/package\s*photo/i) }

  // row → file, per column bucket: 'p' product photo col, 'k' package col, 'a' any other (>=1)
  const byRowCol = {} // row -> { col -> file }
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
      if (!ridFile[rid] || col < 1) continue // col 0 = sheet logo
      byRowCol[row] = byRowCol[row] || {}
      if (byRowCol[row][col] === undefined) byRowCol[row][col] = ridFile[rid]
    }
  }
  const pick = (row) => {
    const c = byRowCol[row]; if (!c) return null
    return c[ci.photo] ?? c[ci.pkg] ?? c[Object.keys(c)[0]] ?? null
  }
  const prods = []; const seen = new Set()
  for (let i = hr + 1; i < rows.length; i++) {
    const r = rows[i]; const name = norm(r[ci.name]); const ean = String(r[ci.ean] || '').replace(/\D/g, '')
    if (ean.length >= 12 && ean.length <= 14 && !seen.has(ean)) { seen.add(ean); prods.push({ ean, row: i }) }
  }
  return { prods, pick }
}

async function main() {
  const wb = XLSX.readFile(XLSX_PATH)
  const byEan = {}; const hasImg = new Set()
  for (let off = 0; ; off += 1000) {
    const { data } = await sb.from('products').select('id,ean,product_images(id)').eq('supplier_id', SUP).range(off, off + 999)
    if (!data || !data.length) break
    for (const p of data) { byEan[p.ean] = p.id; if ((p.product_images || []).length) hasImg.add(p.id) }
    if (data.length < 1000) break
  }
  console.log('missing before:', Object.values(byEan).filter(id => !hasImg.has(id)).length)

  const fileUrl = {}; let done = 0
  for (const sheet of SHEETS) {
    const { prods, pick } = parse(wb, sheet)
    for (const pr of prods) {
      const pid = byEan[pr.ean]; if (!pid || hasImg.has(pid)) continue
      // widening row window
      let img = null
      for (const d of [0, 1, -1, 2, -2, 3]) { img = pick(pr.row + d); if (img) break }
      if (!img) continue
      if (!fileUrl[img]) {
        try {
          const buf = fs.readFileSync(`${DIR}/xl/media/${img}`)
          const ext = img.split('.').pop()
          const up = await sb.storage.from('brand-assets').upload('products/xo/' + img, buf, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: true })
          if (up.error) continue
          fileUrl[img] = sb.storage.from('brand-assets').getPublicUrl('products/xo/' + img).data.publicUrl
        } catch { continue }
      }
      await sb.from('product_images').insert({ product_id: pid, url: fileUrl[img], sort_order: 0 })
      hasImg.add(pid); done++
    }
  }
  console.log('newly attached (pass 2):', done)
  const stillMissing = Object.values(byEan).filter(id => !hasImg.has(id)).length
  console.log('missing after:', stillMissing)
}
main().catch(e => console.log('ERR', e.message))
