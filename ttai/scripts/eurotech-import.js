require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ELEC = '6c8be190-b0dc-4907-870a-e6f190ac2a81', IT = 'c07ae8f7-bf92-498c-b35a-32fe38db8b22', ADMIN = '50741192-904b-40b8-8cac-2afbdb72af66'
const norm = s => String(s || '').replace(/\s+/g, ' ').trim()
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const BRANDS = ['Apple', 'Samsung', 'Sony', 'JBL', 'Xiaomi', 'Huawei', 'Honor', 'Philips', 'Bosch', 'Lenovo', 'Dell', 'Asus', 'Acer', 'Microsoft', 'Nintendo', 'Logitech', 'Anker', 'Belkin', 'Nokia', 'Motorola', 'Realme', 'Oppo', 'OnePlus', 'TP-Link', 'Netgear', 'Garmin', 'Fitbit', "De'Longhi", 'Nespresso', 'Braun', 'Panasonic', 'Canon', 'Nikon', 'GoPro', 'Beats', 'Bose', 'Sennheiser', 'Marshall', 'Razer', 'Corsair', 'Google', 'Redmi', 'Baseus', 'Hisense', 'Whirlpool', 'Rowenta']

const route = (sec) => {
  const s = sec.toLowerCase()
  if (/smartphone|cellulari|usati|used|telefoni/.test(s)) return 'elec-smartphones'
  if (/airpods|cuffie|headphone|altoparlanti|speaker|\bav\b|audio/.test(s)) return 'elec-audio'
  if (/tablet/.test(s)) return 'elec-tablets'
  if (/wearable|indossabili|watch/.test(s)) return 'elec-smart-devices'
  if (/notebook|monitor|mouse|tastiere|keyboard|pendrive|memory|\bhub\b|webcam|\bups\b|alimentatori|power suppl|hdd|ssd|borse|custodie|bags|pos|carte/.test(s)) return 'elec-computers'
  if (/pollici|inches|\bled\b|\btv\b|proiett|projector|decoder|\bcam\b|foto|video|digitali/.test(s)) return 'elec-tv'
  if (/console|games|gaming|sedie/.test(s)) return 'elec-gaming'
  if (/elettrodom|appliance|caff|coffee|cura della persona|personal care|domestic/.test(s)) return 'elec-appliances'
  if (/bici|monopattini|bike|scooter|mobilit|acquascooter/.test(s)) return 'elec-mobility'
  return 'elec-mobile-accessories'
}

async function main() {
  const NEW = [['Tablets', 'elec-tablets', 8], ['Computers & Laptops', 'elec-computers', 9], ['TV & Video', 'elec-tv', 10], ['Gaming', 'elec-gaming', 11], ['Home Appliances', 'elec-appliances', 12], ['Mobility & E-Bikes', 'elec-mobility', 13]]
  const catBySlug = {}
  const { data: ex } = await sb.from('categories').select('id,slug').eq('parent_id', ELEC)
  for (const c of ex) catBySlug[c.slug] = c.id
  for (const [name, slug, so] of NEW) {
    if (catBySlug[slug]) continue
    const { data } = await sb.from('categories').insert({ name, slug, parent_id: ELEC, sort_order: so, status: 'active' }).select('id').single()
    if (data) catBySlug[slug] = data.id
  }
  console.log('categories ready')

  let { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%EuroTech%').maybeSingle()
  if (!sup) {
    const ins = await sb.from('suppliers').insert({ legal_name: 'EuroTech Wholesale', trade_name: 'EuroTech', owner_id: ADMIN, is_house: true, status: 'ACTIVE', marketplace_context: 'both', country_id: IT, tax_id: 'IT-EUROTECH', brand_slug: 'eurotech', reliability_tier: 'SILVER', tagline: 'Apple, Samsung & electronics wholesale stock' }).select('id').single()
    sup = ins.data; console.log('supplier created')
  } else console.log('supplier exists')
  const SUP = sup.id

  const wb = XLSX.readFile('C:/Users/anike/Downloads/Export Full stocklist 05.05.26 (1).xlsx')
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Listineq'], { header: 1, defval: '' })
  let sec = ''; const items = []; const seen = new Set()
  for (const r of rows) {
    const c0 = norm(r[0]), c1 = norm(r[1]), c2 = norm(r[2])
    if (c0 === 'EAN') continue
    if (!c0 && c1 && !c2) { sec = c1; continue }
    if (c0 && c1 && c2) {
      let ps = c2.replace(/\s/g, ''); if (/,/.test(ps)) ps = ps.replace(/\./g, '').replace(',', '.')
      const price = parseFloat(ps); if (!price || price <= 0) continue
      const ean = String(c0); if (seen.has(ean)) continue; seen.add(ean)
      const lc = c1.toLowerCase()
      const brand = BRANDS.find(b => lc.includes(b.toLowerCase())) || null
      const exw = Math.round(price * 100)
      items.push({ supplier_id: SUP, category_id: catBySlug[route(sec)], marketplace_context: 'both', name: c1.slice(0, 140), slug: slugify(c1) + '-' + ean.slice(-5), price_cents: Math.round(exw * 1.03), exw_price_cents: exw, currency_code: 'EUR', min_order_qty: 1, stock_qty: 0, is_published: true, ean: ean.slice(0, 40), brand_name: brand, country_of_origin: 'Italy' })
    }
  }
  console.log('parsed:', items.length)
  let ok = 0
  for (let i = 0; i < items.length; i += 100) {
    const { error } = await sb.from('products').insert(items.slice(i, i + 100))
    if (error) { console.log('batch err @' + i, error.message); break }
    ok += Math.min(100, items.length - i)
  }
  console.log('INSERTED:', ok)
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', SUP)
  console.log('EuroTech total products:', count)
}
main().catch(e => console.log('ERR', e.message))
