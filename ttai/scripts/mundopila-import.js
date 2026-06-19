require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const ES = 'b8b14802-20f2-4292-86cc-a34198b39384'
const ROOT = '6c8be190-b0dc-4907-870a-e6f190ac2a81' // Electronics & Technology
const BANNER = 'C:/Users/anike/Downloads/WhatsApp Image 2026-06-19 at 12.58.33.jpeg'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)

async function findOrCreateCat(name, slug) {
  const { data: ex } = await sb.from('categories').select('id').eq('slug', slug).maybeSingle()
  if (ex) return ex.id
  const { data } = await sb.from('categories').insert({ name, slug, parent_id: ROOT, sort_order: 30, status: 'active' }).select('id').single()
  return data?.id
}

// [brand, model, description, presentation, ean, sku, price, line, type, color?]
const PRODUCTS = [
  ['Toshiba', 'LR06CCA BP-AC', 'Pila Alcalina AA', 'Blíster 4 uds', '4904530581999', 'MP-TOS-LR06AA-4', 0.61, 'Alkaline Batteries', 'bat'],
  ['Toshiba', 'LR03GCA BP-AC', 'Pila Alcalina AAA', 'Blíster 4 uds', '4904530582002', 'MP-TOS-LR03AAA-4', 0.61, 'Alkaline Batteries', 'bat'],
  ['Toshiba', 'CR2032', 'Pila Botón Litio', 'Blíster 5 uds', '4904530102214', 'MP-TOS-CR2032-5', 1.16, 'Lithium Button Cells', 'bat'],
  ['Toshiba', 'CR2025', 'Pila Botón Litio', 'Blíster 5 uds', '4904530102007', 'MP-TOS-CR2025-5', 1.16, 'Lithium Button Cells', 'bat'],
  ['Toshiba', 'CR2016', 'Pila Botón Litio', 'Blíster 5 uds', '4904530102191', 'MP-TOS-CR2016-5', 1.16, 'Lithium Button Cells', 'bat'],
  ['Duracell', 'CR2025', 'Pila Botón Litio', 'Blíster 5 uds', '5000394038461', 'MP-DUR-CR2025-5', 2.77, 'Lithium Button Cells', 'bat'],
  ['Duracell', 'CR2016', 'Pila Botón Litio', 'Blíster 5 uds', '5000394038447', 'MP-DUR-CR2016-5', 2.77, 'Lithium Button Cells', 'bat'],
  ['Toshiba', '403 C', 'Linterna clásica compacta con luz potente', 'Caja 1 ud', '4904530884036', 'MP-TOS-403C-W', 2.25, 'LED Flashlights', 'light', 'Blanco'],
  ['Toshiba', '403 C', 'Linterna clásica compacta con luz potente', 'Caja 1 ud', '4904530884043', 'MP-TOS-403C-BK', 2.25, 'LED Flashlights', 'light', 'Negro'],
  ['Toshiba', '403 BP Mini LED', 'Mini linterna LED compacta y ligera, alto rendimiento', 'Blíster 1 ud', '4904530884050', 'MP-TOS-403BP-R', 3.40, 'LED Flashlights', 'light', 'Roja'],
  ['Toshiba', '403 BP Mini LED', 'Mini linterna LED compacta y ligera, alto rendimiento', 'Blíster 1 ud', '4904530884067', 'MP-TOS-403BP-BL', 3.40, 'LED Flashlights', 'light', 'Azul'],
  ['Toshiba', '403 L Super LED', 'Linterna SUPER LED de alto rendimiento, máxima potencia', 'Blíster 1 ud', '4904530884074', 'MP-TOS-403L-R', 6.80, 'LED Flashlights', 'light', 'Roja'],
  ['Toshiba', '403 L Super LED', 'Linterna SUPER LED de alto rendimiento, máxima potencia', 'Blíster 1 ud', '4904530884081', 'MP-TOS-403L-GR', 6.80, 'LED Flashlights', 'light', 'Verde'],
]

async function insertProduct(row) {
  let ins = await sb.from('products').insert(row).select('id').single()
  if (ins.error && /column|does not exist/i.test(ins.error.message)) {
    const o = { ...row };['product_line', 'ean', 'sku', 'model_name', 'net_content', 'lead_time', 'brand_name'].forEach((k) => delete o[k])
    ins = await sb.from('products').insert(o).select('id').single()
  }
  if (ins.error) { console.log('  err', row.name, ins.error.message); return null }
  return ins.data.id
}

async function main() {
  const CAT_BAT = await findOrCreateCat('Batteries', 'elec-batteries')
  const CAT_LIGHT = await findOrCreateCat('Flashlights & Lighting', 'elec-flashlights')
  console.log('categories:', CAT_BAT, CAT_LIGHT)

  // City Valdemoro (Madrid)
  let { data: city } = await sb.from('cities').select('id').eq('country_id', ES).ilike('name', 'Valdemoro').maybeSingle()
  if (!city) { const r = await sb.from('cities').insert({ country_id: ES, name: 'Valdemoro', slug: 'valdemoro' }).select('id').single(); city = r.data }

  // Banner
  let bannerUrl = null
  try {
    const buf = fs.readFileSync(BANNER)
    const up = await sb.storage.from('brand-assets').upload('banners/mundo-pila.jpg', buf, { contentType: 'image/jpeg', upsert: true })
    if (!up.error) bannerUrl = sb.storage.from('brand-assets').getPublicUrl('banners/mundo-pila.jpg').data.publicUrl
  } catch (e) { console.log('banner err', e.message) }

  // Supplier
  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%MUNDO PILA%').maybeSingle()
  const supRow = {
    legal_name: 'MUNDO PILA S.L.', trade_name: 'Mundo Pila', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'both', country_id: ES, city_id: city?.id ?? null, tax_id: 'B06882411', brand_slug: 'mundo-pila',
    reliability_tier: 'GOLD', founded_year: 2005, years_experience: 20,
    whatsapp: '+34677735236', phone: '+34912893818', website: 'https://www.mundopila.es', business_email: 'administracion@mundopila.es',
    address_line1: 'C/ Miguel Servet 1, Nave 15', postal_code: '28341',
    banner_image: bannerUrl,
    tagline: 'Distribución mayorista de pilas y baterías — Official Toshiba Distributor',
    about_company: 'MUNDO PILA S.L. is a Spanish wholesale distributor of batteries and power solutions based in Valdemoro, Madrid. Official Toshiba distributor with 20+ years of experience — alkaline (AA/AAA/9V), lithium button cells, chargers, power solutions and LED flashlights. 100% original products, large stock ready to ship across Spain and internationally.',
    description: 'Wholesale batteries & power solutions — Official Toshiba distributor (Spain).',
    badges: ['Spain Supplier', 'Official Toshiba Distributor', 'Wholesale', 'Batteries & Power'],
  }
  if (!sup) {
    let ins = await sb.from('suppliers').insert(supRow).select('id').single()
    if (ins.error) { delete supRow.badges; delete supRow.banner_image; ins = await sb.from('suppliers').insert(supRow).select('id').single() }
    sup = ins.data; console.log('supplier created')
  } else {
    const upd = { ...supRow }; delete upd.legal_name
    let r = await sb.from('suppliers').update(upd).eq('id', sup.id)
    if (r.error) { delete upd.badges; delete upd.banner_image; await sb.from('suppliers').update(upd).eq('id', sup.id) }
    console.log('supplier updated')
  }
  const SUP = sup.id
  console.log('banner set:', !!bannerUrl)

  // Products
  let ok = 0
  for (const [brand, model, desc, pres, ean, sku, price, line, type, color] of PRODUCTS) {
    const name = type === 'light'
      ? `${brand} Linterna ${model} ${color} · ${pres}`
      : `${brand} ${desc} (${model}) · ${pres}`
    const id = await insertProduct({
      supplier_id: SUP, category_id: type === 'light' ? CAT_LIGHT : CAT_BAT, marketplace_context: 'both',
      name: name.replace(/\s+/g, ' ').slice(0, 140), slug: slugify(`${brand}-${model}-${color || desc}`) + '-' + ean.slice(-5),
      brand_name: brand, product_line: line, model_name: model, sku, ean,
      net_content: pres, description: `${name}. ${desc}. Precio distribuidor mayorista.`,
      price_cents: Math.round(price * 100), currency_code: 'EUR',
      min_order_qty: 1, stock_qty: 200, lead_time: 'Ready to Ship',
      country_of_origin: brand === 'Toshiba' ? 'Japan' : 'EU', is_published: true,
    })
    if (id) ok++
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('INSERTED:', ok, '| Mundo Pila total products:', count)
}
main().catch((e) => console.log('ERR', e.message))
