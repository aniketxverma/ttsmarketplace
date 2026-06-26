require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '78349bc3-e146-48d4-8232-dc4ae32e1080'
const DIR = 'C:/tmp/oscalx'
const XLS = 'C:/Users/anike/Downloads/OSCAL Catalogue June 2026-Alice.xlsx'
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'

async function uploadImg(file, dest) {
  const buf = fs.readFileSync(path.join(DIR, file))
  const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(file), upsert: true })
  if (up.error) { console.log('  up err', up.error.message); return null }
  return sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
}

async function main() {
  // rId -> media file
  const rels = fs.readFileSync(DIR + '/xl/drawings/_rels/drawing1.xml.rels', 'utf8')
  const rid2 = {}; for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) rid2[m[1]] = m[2].replace('../', 'xl/')
  // anchors row -> file
  const draw = fs.readFileSync(DIR + '/xl/drawings/drawing1.xml', 'utf8')
  const anchors = []
  for (const a of draw.matchAll(/<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g)) {
    const blk = a[0]
    const row = (blk.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/) || [])[1]
    const rid = (blk.match(/r:embed="(rId\d+)"/) || [])[1]
    if (row != null && rid && rid2[rid]) anchors.push({ row: +row, file: rid2[rid] })
  }
  // Skip images that repeat across many rows (shared graphic, e.g. package/logo overlay)
  const fileCount = {}; anchors.forEach(a => fileCount[a.file] = (fileCount[a.file] || 0) + 1)
  const shared = new Set(Object.entries(fileCount).filter(([, c]) => c > 2).map(([f]) => f))

  // row -> model (carry forward)
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLS).Sheets['OSCAL Product Price list'], { header: 1, defval: '' })
  const modelAt = (row) => {
    let m = ''
    for (let i = 0; i <= row; i++) { const v = String(rows[i]?.[1] || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(); if (v) m = v }
    return m.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
  }

  // 1) Logo from row 0
  const logoAnchor = anchors.find(a => a.row === 0)
  if (logoAnchor) {
    const url = await uploadImg(logoAnchor.file, `oscal/logo.${logoAnchor.file.split('.').pop()}`)
    if (url) { await sb.from('suppliers').update({ logo_url: url }).eq('id', SUP); console.log('Logo set') }
  }

  // 2) Group product images by model
  const byModel = new Map()
  for (const a of anchors) {
    if (a.row === 0 || shared.has(a.file)) continue
    const model = modelAt(a.row)
    if (!model) continue
    if (!byModel.has(model)) byModel.set(model, [])
    if (!byModel.get(model).includes(a.file)) byModel.get(model).push(a.file)
  }

  // 3) Fetch OSCAL products
  const { data: prods } = await sb.from('products').select('id, name').eq('supplier_id', SUP)
  let attached = 0, modelsMatched = 0
  for (const [model, files] of byModel) {
    const base = `OSCAL ${model}`.toLowerCase()
    const matches = (prods || []).filter(p => { const n = p.name.toLowerCase(); return n === base || n.startsWith(base + ' ') })
    if (!matches.length) { console.log('  no product for model:', model); continue }
    modelsMatched++
    // upload the model's images once, then attach to each matching variant
    const urls = []
    let n = 0
    for (const f of files) { const u = await uploadImg(f, `oscal/${slug(model)}-${n}.${f.split('.').pop()}`); if (u) { urls.push(u); n++ } }
    for (const p of matches) {
      await sb.from('product_images').delete().eq('product_id', p.id)
      for (let i = 0; i < urls.length; i++) await sb.from('product_images').insert({ product_id: p.id, url: urls[i], sort_order: i })
      attached++
    }
  }
  console.log(`Models matched: ${modelsMatched} | product listings with images: ${attached}`)
  console.log('DONE')
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) }
main().catch(e => console.log('ERR', e.message))
