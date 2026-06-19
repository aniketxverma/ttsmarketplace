const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

const COLOR = { blanco: 'white', negro: 'black', roja: 'red', rojo: 'red', azul: 'blue', verde: 'green' }

function queryFor(p) {
  const brand = p.brand_name || 'Toshiba'
  const model = (p.model_name || '').replace(/BP-AC|BP/i, '').trim()
  if (p.product_line === 'LED Flashlights') {
    const colWord = (p.name.split('·')[0].trim().split(/\s+/).pop() || '').toLowerCase()
    const col = COLOR[colWord] || ''
    return `${brand} ${model} LED flashlight ${col}`.replace(/\s+/g, ' ').trim()
  }
  if (p.product_line === 'Alkaline Batteries') {
    const size = /AAA/i.test(p.name) ? 'AAA' : 'AA'
    return `${brand} ${size} alkaline battery blister`
  }
  // Button cells
  return `${brand} ${model} lithium battery`
}

async function main() {
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%MUNDO PILA%').single()
  const { data: products } = await sb.from('products')
    .select('id, name, brand_name, model_name, product_line, product_images(id)')
    .eq('supplier_id', sup.id).order('product_line')

  let done = 0, missed = 0
  for (const p of products) {
    if ((p.product_images || []).length) continue
    const q = queryFor(p)
    const imgs = await fetchImages(q, { count: 1, minDim: 300 })
    await sleep(600)
    if (!imgs[0]) { console.log('✗', q); missed++; continue }
    const url = await upload(imgs[0].buf, `mundo-pila/${p.id}${imgs[0].ext}`, imgs[0].ext)
    if (!url) continue
    await sb.from('product_images').insert({ product_id: p.id, url, sort_order: 0 })
    console.log('✓', p.name, '←', q)
    done++
  }
  console.log(`\nDONE · images added: ${done} · not found: ${missed} · total: ${products.length}`)
}
main().catch((e) => console.log('ERR', e.message))
