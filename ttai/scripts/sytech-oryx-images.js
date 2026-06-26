require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = 'ba9c388a-735b-4e15-a36a-4f19d02db2dc' // Sytech Madrid
const XLS = 'C:/Users/anike/Downloads/CATALOGO ORYX 15.06.xlsx.xlsx'
const DIR = 'C:/tmp/oryxx'
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'
const norm = (s) => String(s ?? '').replace(/\s+/g, '').toUpperCase()

async function main() {
  // Kept Sytech products by SKU
  const { data: prods } = await sb.from('products').select('id, sku').eq('supplier_id', SUP)
  const bySku = new Map((prods || []).filter(p => p.sku).map(p => [norm(p.sku), p.id]))

  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLS).Sheets['Table 1'], { header: 1, defval: '' })
  const skuAt = (row) => {
    for (const r of [row, row - 1, row + 1, row - 2]) { // image may anchor a row off
      const sku = norm(rows[r]?.[1]); if (sku && bySku.has(sku)) return sku
    }
    return null
  }

  // drawing anchors
  const rels = fs.readFileSync(DIR + '/xl/drawings/_rels/drawing1.xml.rels', 'utf8')
  const rid2 = {}; for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) rid2[m[1]] = m[2].replace('../', 'xl/')
  const draw = fs.readFileSync(DIR + '/xl/drawings/drawing1.xml', 'utf8')
  const anchors = []
  for (const a of draw.matchAll(/<xdr:(?:one|two)CellAnchor[\s\S]*?<\/xdr:(?:one|two)CellAnchor>/g)) {
    const blk = a[0]
    const rw = (blk.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/) || [])[1]
    const rid = (blk.match(/r:embed="(rId\d+)"/) || [])[1]
    if (rw != null && rid && rid2[rid]) anchors.push({ row: +rw, file: rid2[rid] })
  }
  const fileCount = {}; anchors.forEach(a => fileCount[a.file] = (fileCount[a.file] || 0) + 1)
  const shared = new Set(Object.entries(fileCount).filter(([, c]) => c > 2).map(([f]) => f))

  // group image files per matched product
  const byPid = new Map()
  for (const a of anchors) {
    if (shared.has(a.file)) continue
    const sku = skuAt(a.row); if (!sku) continue
    const pid = bySku.get(sku)
    if (!byPid.has(pid)) byPid.set(pid, [])
    if (!byPid.get(pid).includes(a.file)) byPid.get(pid).push(a.file)
  }

  let attached = 0
  for (const [pid, files] of byPid) {
    await sb.from('product_images').delete().eq('product_id', pid) // replace web image with the real catalogue photo
    let n = 0
    for (const f of files.slice(0, 5)) {
      const buf = fs.readFileSync(path.join(DIR, f))
      const dest = `sytech/${pid}-${n}.${f.split('.').pop()}`
      const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(f), upsert: true })
      if (up.error) { console.log('  img err', up.error.message); continue }
      const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
      await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
    }
    if (n > 0) attached++
  }

  // report which of the 46 still have no image
  let missing = 0
  for (const p of prods) { const { count } = await sb.from('product_images').select('*', { count: 'exact', head: true }).eq('product_id', p.id); if (!count) { missing++; console.log('  still no image:', p.sku) } }
  console.log(`\nMatched catalogue images to ${attached}/${prods.length} products · still missing: ${missing}`)
}
main().catch(e => console.log('ERR', e.message))
