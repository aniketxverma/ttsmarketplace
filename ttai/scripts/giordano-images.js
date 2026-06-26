require('dotenv').config({ path: '.env.local' })
const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

const SUP = 'e9528336-b5dc-4e6a-8409-d1645682ffa6'

// Build a focused search query for an OSCAL/Giordano coffee product.
function queryFor(name) {
  const core = name.replace(/^Giordano\s*/i, '').replace(/—/g, ' ').replace(/\s+/g, ' ').trim()
  return `Giordano caffè ${core} coffee`
}

async function main() {
  // Logo
  try {
    const [logo] = await fetchImages('Giordano caffè del piacere coffee logo', { count: 1, minDim: 200 })
    if (logo) {
      const url = await upload(logo.buf, `giordano/logo${logo.ext}`, logo.ext)
      if (url) { await sb.from('suppliers').update({ logo_url: url }).eq('id', SUP); console.log('Logo set') }
    }
  } catch (e) { console.log('logo err', e.message) }

  const { data: prods } = await sb.from('products').select('id, name').eq('supplier_id', SUP).order('name')
  let ok = 0, miss = 0
  for (const p of (prods || [])) {
    // skip if already has an image (idempotent re-runs)
    const { count } = await sb.from('product_images').select('*', { count: 'exact', head: true }).eq('product_id', p.id)
    if (count > 0) { ok++; continue }
    const q = queryFor(p.name)
    let imgs = await fetchImages(q, { count: 1, minDim: 300 })
    if (!imgs.length) imgs = await fetchImages(p.name + ' coffee', { count: 1, minDim: 250 }) // fallback
    if (!imgs.length) { console.log('  ✗', p.name.slice(0, 40)); miss++; await sleep(700); continue }
    const url = await upload(imgs[0].buf, `giordano/${p.id}-0${imgs[0].ext}`, imgs[0].ext)
    if (url) { await sb.from('product_images').insert({ product_id: p.id, url, sort_order: 0 }); ok++; console.log('  ✓', p.name.slice(0, 40)) }
    await sleep(1100) // be gentle on the source
  }
  console.log(`\nGiordano images — with image: ${ok}/${prods.length} · missed: ${miss}`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
