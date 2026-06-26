require('dotenv').config({ path: '.env.local' })
const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

const SUP = 'ba9c388a-735b-4e15-a36a-4f19d02db2dc'

async function main() {
  const { data: prods } = await sb.from('products').select('id, name, sku').eq('supplier_id', SUP).order('sku')
  let ok = 0, miss = 0, done = 0
  for (const p of (prods || [])) {
    done++
    const { count } = await sb.from('product_images').select('*', { count: 'exact', head: true }).eq('product_id', p.id)
    if (count > 0) { ok++; continue }
    const name = p.name.replace(/É/g, 'é').replace(/Á/g, 'á').replace(/Í/g, 'í').replace(/Ó/g, 'ó').replace(/Ú/g, 'ú')
    // Try by exact model code (most precise), then brand+name, then plain name.
    const queries = [
      p.sku ? `ORYX ${p.sku}` : null,
      p.sku ? `Sytech ${p.sku}` : null,
      `ORYX ${name}`,
      `${name} electrodoméstico`,
    ].filter(Boolean)
    let imgs = []
    for (const q of queries) { imgs = await fetchImages(q, { count: 1, minDim: 300 }); if (imgs.length) break }
    if (!imgs.length) { console.log(`  ✗ [${done}/${prods.length}] ${p.sku} ${name.slice(0, 32)}`); miss++; await sleep(700); continue }
    const url = await upload(imgs[0].buf, `sytech/${p.id}-0${imgs[0].ext}`, imgs[0].ext)
    if (url) { await sb.from('product_images').insert({ product_id: p.id, url, sort_order: 0 }); ok++; console.log(`  ✓ [${done}/${prods.length}] ${p.sku} ${name.slice(0, 32)}`) }
    await sleep(1000)
  }
  console.log(`\nSytech (ORYX) images — with image: ${ok}/${prods.length} · missed: ${miss}`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
