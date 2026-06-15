// Attach embedded Excel photos to any XO product still missing an image.
// Fixes the import run where the EAN→id map was capped at 1000 rows.
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

function sheetImages(wb, sheetName) {
  const sheetIdx = wb.SheetNames.indexOf(sheetName)
  const sheetFile = `sheet${sheetIdx + 1}.xml`
  const wsRels = fs.readFileSync(`${DIR}/xl/worksheets/_rels/${sheetFile}.rels`, 'utf8')
  const drawTarget = (wsRels.match(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/) || [])[1]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
  let hr = -1
  for (let i = 0; i < 10; i++) { if (rows[i] && rows[i].some(c => /barcode/i.test(String(c)))) { hr = i; break } }
  const H = rows[hr].map(norm)
  const find = re => H.findIndex(h => re.test(h))
  const ci = { name: find(/product.?s? name/i), ean: find(/barcode/i), photo: find(/product\s*photo/i), pkg: find(/package\s*photo/i) }

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
  const out = []; let lastImg = null; const seen = new Set()
  for (let i = hr + 1; i < rows.length; i++) {
    const r = rows[i]; const name = norm(r[ci.name]); const ean = String(r[ci.ean] || '').replace(/\D/g, ''); const imgP = rowImgP[i]
    if (name) lastImg = imgP || null
    else if (imgP) lastImg = imgP
    if (ean.length >= 12 && ean.length <= 14 && !seen.has(ean)) { seen.add(ean); out.push({ ean, img: imgP || lastImg || rowImgK[i] || null }) }
  }
  return out
}

async function main() {
  const wb = XLSX.readFile(XLSX_PATH)
  // full ean→id + has-image set (paginated)
  const byEan = {}; const hasImg = new Set()
  for (let off = 0; ; off += 1000) {
    const { data } = await sb.from('products').select('id,ean,product_images(id)').eq('supplier_id', SUP).range(off, off + 999)
    if (!data || !data.length) break
    for (const p of data) { byEan[p.ean] = p.id; if ((p.product_images || []).length) hasImg.add(p.id) }
    if (data.length < 1000) break
  }
  console.log('XO products mapped:', Object.keys(byEan).length, '| already have image:', hasImg.size)

  const fileUrl = {}; let done = 0, fail = 0
  for (const sheet of SHEETS) {
    const imgs = sheetImages(wb, sheet)
    let s = 0
    for (const it of imgs) {
      const pid = byEan[it.ean]; if (!pid || !it.img || hasImg.has(pid)) continue
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
      hasImg.add(pid); done++; s++
    }
    if (s) console.log(`  ${sheet}: +${s} images`)
  }
  console.log('TOTAL newly attached:', done, '| fails:', fail)
}
main().catch(e => console.log('ERR', e.message))
