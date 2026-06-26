require('dotenv').config({ path: '.env.local' })
const fs = require('fs'), path = require('path'), XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SUP = '3a25e3d0-acb8-499c-bdd7-c744d3ad63d7' // Tehnomag
const CAT = '6c8be190-b0dc-4907-870a-e6f190ac2a81'
const XLS = 'C:/Users/anike/Downloads/ELIT SDA 05-2026 promo.xlsx'
const DIR = 'C:/tmp/sdax'
const clean = (s) => String(s ?? '').replace(/\r/g, '').replace(/\s+/g, ' ').trim()
const digits = (s) => String(s ?? '').replace(/\D/g, '')
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)
const ctype = (f) => f.endsWith('.png') ? 'image/png' : 'image/jpeg'

async function main() {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(XLS).Sheets['ELIT SDA'], { header: 1, defval: '' })
  // existing Tehnomag products → upsert by EAN to avoid dupes on re-run
  const { data: existing } = await sb.from('products').select('id, ean').eq('supplier_id', SUP)
  const byEan = new Map((existing || []).filter(p => p.ean).map(p => [digits(p.ean), p.id]))

  let section = '', ok = 0
  const rowToProduct = {}
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i]
    const code = clean(r[0]); const model = String(r[1] ?? '').replace(/\r/g, '')
    const ean = digits(r[2]); const spec = clean(r[4])
    const reg = parseFloat(r[5]); const promo = parseFloat(r[6]); const minord = parseInt(r[8]); const rrp = parseFloat(r[9]); const stock = parseInt(r[10]); const eta = clean(r[11]); const origin = clean(r[14])
    if (!model.trim() && code && isNaN(reg) && isNaN(promo)) { section = titleCase(code); continue } // section header
    const price = !isNaN(promo) && promo > 0 ? promo : reg
    if (!model.trim() || isNaN(price) || price <= 0) continue
    const name = clean(model.split('\n')[0]).slice(0, 140)
    const sku = /^\d+$/.test(code) ? code : null

    const row = {
      supplier_id: SUP, category_id: CAT, marketplace_context: 'wholesale',
      name, slug: slugify(`${name}-${sku || ean || i}`),
      brand_name: 'Elite', product_line: section || 'Small Appliances',
      sku, ean: ean ? ean.slice(0, 40) : null,
      description: `${clean(model)}\n\n${spec}\n\n${rrp ? 'RRP: €' + rrp + '\n' : ''}${eta ? 'ETA: ' + eta + '\n' : ''}Promo price 05-2026. B2B wholesale. IVA 21%.`,
      specs: { Brand: 'Elite', Code: code, EAN: ean || '', Category: section, 'Regular price': reg || '', 'Promo price': price, RRP: rrp || '', Origin: origin || '', ETA: eta || '' },
      price_cents: Math.round(price * 100),
      retail_price_cents: !isNaN(rrp) && rrp > 0 ? Math.round(rrp * 100) : null,
      vat_rate: 21, currency_code: 'EUR',
      sell_piece: false, sell_box: true, sell_pallet: true, sell_truck: true,
      min_order_qty: !isNaN(minord) && minord > 0 ? minord : 1,
      stock_qty: !isNaN(stock) ? stock : 100, is_published: true,
      country_of_origin: origin || 'Imported', lead_time: eta || 'Promo · stock',
    }
    let pid = ean ? byEan.get(ean) : null
    if (pid) { await sb.from('products').update(row).eq('id', pid) }
    else { const ins = await sb.from('products').insert(row).select('id').single(); if (ins.error) { console.log('  err', name, ins.error.message); continue } pid = ins.data.id }
    rowToProduct[i] = pid; ok++
  }
  console.log('SDA products upserted:', ok)

  // images (oneCell + twoCell anchors → nearest product row)
  let attached = 0
  try {
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
        const dest = `elit-sda/${pid}-${n}.${f.split('.').pop()}`
        const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(f), upsert: true })
        if (up.error) { console.log('  img err', up.error.message); continue }
        const url = sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
        await sb.from('product_images').insert({ product_id: pid, url, sort_order: n }); n++
      }
      if (n > 0) attached++
    }
  } catch (e) { console.log('image step err:', e.message) }

  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`Tehnomag now: ${count} products | SDA listings with images: ${attached}`)
}
main().catch(e => console.log('ERR', e.message))
