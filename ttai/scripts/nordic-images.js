const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

async function main() {
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%Nordic Snacks%').single()
  const { data: products } = await sb.from('products')
    .select('id, name, brand_name, product_images(id)')
    .eq('supplier_id', sup.id).order('product_line')

  let done = 0, missed = 0
  for (const p of products) {
    if ((p.product_images || []).length) continue
    // name already includes the brand; drop a duplicated leading brand token.
    const q = p.name.replace(new RegExp('^' + (p.brand_name || '').replace(/[^a-z0-9]/gi, '.') + '\\s+', 'i'), p.brand_name + ' ')
    const imgs = await fetchImages(q + ' snack', { count: 1, minDim: 300 })
      .then((r) => r.length ? r : fetchImages(q, { count: 1, minDim: 300 }))
    await sleep(600)
    if (!imgs[0]) { console.log('✗', p.name); missed++; continue }
    const url = await upload(imgs[0].buf, `nordic-snacks/${p.id}${imgs[0].ext}`, imgs[0].ext)
    if (!url) continue
    await sb.from('product_images').insert({ product_id: p.id, url, sort_order: 0 })
    done++
    if (done % 10 === 0) console.log('  …', done)
  }
  console.log(`\nDONE · images: ${done} · missed: ${missed} · total: ${products.length}`)
}
main().catch((e) => console.log('ERR', e.message))
