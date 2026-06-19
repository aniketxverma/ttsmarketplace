const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

// Product names already include brand + model + colour (e.g. "JBL TUNE 520BT
// BLACK"), so a direct search returns the right variant.
async function main() {
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%JBL Hub%').single()
  const { data: products } = await sb.from('products')
    .select('id, name, product_images(id)')
    .eq('supplier_id', sup.id).order('product_line')

  let done = 0, skipped = 0, missed = 0
  for (const p of products) {
    if ((p.product_images || []).length) { skipped++; continue }
    const imgs = await fetchImages(p.name + ' headphones', { count: 1, minDim: 300 })
      .then((r) => r.length ? r : fetchImages(p.name, { count: 1, minDim: 300 }))
    const img = imgs[0]
    await sleep(600)
    if (!img) { console.log('✗', p.name); missed++; continue }
    const url = await upload(img.buf, `jbl-hub/${p.id}${img.ext}`, img.ext)
    if (!url) continue
    await sb.from('product_images').insert({ product_id: p.id, url, sort_order: 0 })
    done++
    if (done % 20 === 0) console.log('  …', done, 'images')
  }
  console.log(`\nDONE · images added: ${done} · already had: ${skipped} · not found: ${missed} · total: ${products.length}`)
}
main().catch((e) => console.log('ERR', e.message))
