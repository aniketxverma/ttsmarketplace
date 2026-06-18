const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

// Search query per phone: brand + model (drop the storage variant — same photo).
function queryFor(p) {
  const model = (p.model_name || p.name || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
  const brand = p.brand_name || ''
  const base = model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`
  return `${base} smartphone`.replace(/\s+/g, ' ').trim()
}

async function main() {
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%YASRA%').single()
  const { data: products } = await sb.from('products')
    .select('id, name, brand_name, model_name, net_content, product_images(id)')
    .eq('supplier_id', sup.id).order('brand_name')

  // De-dupe searches: same model+storage → reuse the image (e.g. A17 8/256 vs A17 4/128).
  const cache = new Map()
  let done = 0, skipped = 0
  for (const p of products) {
    if ((p.product_images || []).length) { skipped++; continue } // already has an image
    const q = queryFor(p)
    let img = cache.get(q)
    if (!img) {
      const imgs = await fetchImages(q + ' product white background', { count: 1, minDim: 350 })
      img = imgs[0] || null
      cache.set(q, img)
      await sleep(700)
    }
    if (!img) { console.log('✗ no image:', q); continue }
    const url = await upload(img.buf, `yasra-products/${p.id}${img.ext}`, img.ext)
    if (!url) continue
    await sb.from('product_images').insert({ product_id: p.id, url, sort_order: 0 })
    console.log('✓', p.name, '←', q)
    done++
  }
  console.log(`\nDONE · images added: ${done} · already had: ${skipped} · total products: ${products.length}`)
}
main().catch((e) => console.log('ERR', e.message))
