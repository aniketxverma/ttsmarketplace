require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const ES = 'b8b14802-20f2-4292-86cc-a34198b39384'
const CAT = '6c8be190-b0dc-4907-870a-e6f190ac2a81' // Electronics & Technology
const FILE = 'C:/Users/anike/Downloads/CATALOGO ORYX 15.06.xlsx.xlsx'

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const digits = (s) => String(s ?? '').replace(/\D/g, '')
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56)

async function ensureSupplier(row) {
  let { data: sup } = await sb.from('suppliers').select('id').eq('brand_slug', row.brand_slug).maybeSingle()
  if (!sup) {
    let ins = await sb.from('suppliers').insert(row).select('id').single()
    if (ins.error) { const r = { ...row }; delete r.badges; ins = await sb.from('suppliers').insert(r).select('id').single() }
    if (ins.error) { console.log('supplier err', ins.error.message); process.exit(1) }
    sup = ins.data; console.log(row.trade_name, 'CREATED', sup.id)
  } else console.log(row.trade_name, 'exists', sup.id)
  return sup.id
}

async function insertProduct(row) {
  let ins = await sb.from('products').insert(row).select('id').single()
  if (ins.error && /column|does not exist/i.test(ins.error.message)) {
    const o = { ...row };['product_line', 'ean', 'units_per_carton', 'net_content', 'price_on_request', 'specs', 'lead_time', 'brand_name'].forEach((k) => delete o[k])
    ins = await sb.from('products').insert(o).select('id').single()
  }
  if (ins.error) { console.log('  err', row.name, ins.error.message); return null }
  return ins.data.id
}

async function main() {
  const SUP = await ensureSupplier({
    legal_name: 'R.M. TECH (Noor Ranjit Mansigani)', trade_name: 'Sytech Madrid', owner_id: ADMIN, is_house: true, status: 'ACTIVE',
    marketplace_context: 'wholesale', country_id: ES, tax_id: 'ES-51141805V', brand_slug: 'sytech-madrid', reliability_tier: 'SILVER',
    business_email: 'ranjitmansingani@gmail.com', whatsapp: '34667636167', phone: '+34 667 63 61 67', website: null,
    address_line1: 'Calle Junio, 12 planta baja', address_line2: 'Madrid', postal_code: '28022',
    tagline: 'Sytech Madrid — electrónica y electrodomésticos al por mayor (B2B)',
    about_company: 'R.M. TECH (Sytech Madrid) — distribuidor mayorista de electrónica y electrodomésticos: cocina, ventilación, menaje, planchas, cuidado personal, iluminación, tecnología, herramientas, básculas, cargadores y altavoces. Venta B2B únicamente — por palé o camión completo. Precios + IVA 21%. Madrid, España.',
    description: 'Electrónica y electrodomésticos al por mayor — B2B por palé o camión. Madrid.',
    badges: ['Spain Supplier', 'Electronics & Appliances', 'Wholesale', 'B2B — Pallet / Truck'],
  })

  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets['Table 1'], { header: 1, defval: '' })
  let section = '', ok = 0
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i]
    const c0 = clean(r[0]); const sku = clean(r[1]); const ean = digits(r[2])
    const article = clean(r[3]); const units = clean(r[4]); const price = parseFloat(r[5])
    if (c0 && !sku && r[5] === '') { section = titleCase(c0); continue } // section header
    if (!sku || isNaN(price) || price <= 0 || !article) continue

    const upc = parseInt((units.match(/(\d+)/) || [])[1]) || null
    // Name = first clause of the article (the product type in caps), title-cased.
    let name = article.split(/[.\n]/)[0].trim()
    if (name.length > 70) name = name.slice(0, 70).trim()
    name = titleCase(name)

    const id = await insertProduct({
      supplier_id: SUP, category_id: CAT, marketplace_context: 'wholesale',
      name: `${name}`.slice(0, 140), slug: slugify(`${name}-${sku}`) + '-' + Math.random().toString(36).slice(2, 5),
      brand_name: 'ORYX', product_line: section || 'Electrónica',
      sku, ean: ean ? ean.slice(0, 40) : null,
      units_per_carton: upc,
      description: `${article}\n\n${units ? units + '\n' : ''}${ean ? 'EAN: ' + ean + '\n' : ''}Precio + IVA 21%. Venta B2B — por palé o camión completo.`,
      specs: { Brand: 'ORYX', SKU: sku, EAN: ean || '', 'Uds/caja': upc || '', Categoría: section, IVA: '21%', Venta: 'B2B — palé o camión' },
      price_cents: Math.round(price * 100),
      price_per_box_cents: upc ? Math.round(price * upc * 100) : null,
      retail_price_cents: null, vat_rate: 21, currency_code: 'EUR',
      sell_piece: false, sell_box: true, sell_pallet: true, sell_truck: true,
      min_order_qty: 1, min_box_qty: 1, stock_qty: 500, is_published: true, country_of_origin: 'Imported', lead_time: 'B2B · palé/camión',
    })
    if (id) ok++
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log(`Sytech Madrid: ${count} products (inserted ${ok})`)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
