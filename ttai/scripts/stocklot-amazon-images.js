const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

// Representative imagery for the Amazon FBA lot (its Excel has no embedded photos).
const QUERIES = [
  'amazon returns mixed pallet warehouse',
  'liquidation pallet returns stock lot',
  'amazon fba returns pallet boxes',
  'wholesale returns pallets warehouse',
  'mixed customer returns pallet electronics',
]

async function main() {
  const { data: prod } = await sb.from('products')
    .select('id, name, product_images(id)')
    .ilike('slug', 'amazon-fba-returns-66-mixed-pallets%').single()
  if (!prod) return console.log('Amazon lot not found')

  await sb.from('product_images').delete().eq('product_id', prod.id)
  let n = 0
  for (const q of QUERIES) {
    const imgs = await fetchImages(q, { count: 1, minDim: 500 })
    const img = imgs[0]
    if (!img) { console.log('✗ no image:', q); continue }
    const url = await upload(img.buf, `stocklots/amazon/${prod.id}-${n}${img.ext}`, img.ext)
    if (url) { await sb.from('product_images').insert({ product_id: prod.id, url, sort_order: n }); console.log('✓', q); n++ }
    await sleep(700)
  }
  console.log(`\nDONE · Amazon lot images: ${n}`)
}
main().catch((e) => console.log('ERR', e.message))
