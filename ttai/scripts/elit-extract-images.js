require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const X = 'C:/tmp/elit/x'
const norm = (s) => String(s ?? '').trim()
const numify = (v) => { const n = parseFloat(String(v).replace(/[^0-9.,]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n }
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'

async function main() {
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%Elit Cooling%').single()
  const SUP = sup.id

  // rId → media file (images only, skip hdphoto .wdp)
  const rels = fs.readFileSync(path.join(X, 'xl/drawings/_rels/drawing1.xml.rels'), 'utf8')
  const rid2img = {}
  for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*?Target="\.\.\/media\/(image\d+\.\w+)"/g)) rid2img[m[1]] = m[2]

  // Each anchor: from-row (0-based) + first image rId
  const drawing = fs.readFileSync(path.join(X, 'xl/drawings/drawing1.xml'), 'utf8')
  const rowImages = new Map() // row -> [mediaFile,...]
  for (const block of drawing.split('<xdr:twoCellAnchor').slice(1)) {
    const fromRow = block.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)
    const embed = block.match(/r:embed="(rId\d+)"/)
    if (!fromRow || !embed) continue
    const img = rid2img[embed[1]]; if (!img) continue
    const row = parseInt(fromRow[1])
    if (!rowImages.has(row)) rowImages.set(row, [])
    rowImages.get(row).push(img)
  }
  console.log('rows with images:', rowImages.size)

  // Sheet rows → product per row (by EAN / name)
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile('C:/Users/anike/Downloads/ELIT COOLING 06-2026 export ES.xlsx').Sheets['Cooling 2026'], { header: 1, defval: '' })

  let done = 0
  for (let i = 0; i < rows.length; i++) {
    const imgs = rowImages.get(i); if (!imgs || !imgs.length) continue
    const r = rows[i]
    const model = norm(r[1]), ean = norm(r[2]), price = numify(r[7])
    if (!model || price <= 0) continue
    // find the product
    let q = sb.from('products').select('id, product_images(id)').eq('supplier_id', SUP)
    q = ean ? q.eq('ean', ean.slice(0, 40)) : q.eq('name', model.slice(0, 140))
    const { data: prod } = await q.maybeSingle()
    if (!prod) { console.log('no product for row', i, model); continue }
    if ((prod.product_images ?? []).length) {
      // remove placeholder/old images so the real photo is primary
      await sb.from('product_images').delete().eq('product_id', prod.id)
    }
    // Largest file first → the main product shot is the primary thumbnail
    // (small images are usually remotes / control-panel detail shots).
    imgs.sort((a, b) => fs.statSync(path.join(X, 'xl/media', b)).size - fs.statSync(path.join(X, 'xl/media', a)).size)
    let n = 0
    for (const img of imgs) {
      const buf = fs.readFileSync(path.join(X, 'xl/media', img))
      const dest = `elit-products/${prod.id}-${n}${path.extname(img)}`
      const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(img), upsert: true })
      if (up.error) { console.log('upload err', img, up.error.message); continue }
      const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
      await sb.from('product_images').insert({ product_id: prod.id, url, sort_order: n })
      n++
    }
    done++
  }
  console.log('products with real images:', done)
}
main().catch((e) => console.log('ERR', e.message))
