require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// One catalog-style "family" image per electronics sub-category. Each EuroTech
// product (which has no photo) gets its family image so the grid isn't blank;
// the category card also gets the image. VARIANTS per family adds variety so
// 568 smartphones don't all show the identical tile.
const VARIANTS = 3
const FAMILIES = {
  'elec-smartphones':        'A clean professional product catalog photo of modern smartphones, several phones standing and angled, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-mobile-accessories': 'A clean product catalog photo of mobile phone accessories — cases, charging cables, power bank and earbuds neatly arranged, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-gaming':             'A clean product catalog photo of a game console with a wireless controller, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-audio':              'A clean product catalog photo of over-ear headphones and a bluetooth speaker, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-tablets':            'A clean product catalog photo of a modern tablet with a stylus, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-smart-devices':      'A clean product catalog photo of a smartwatch and a fitness band, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-computers':          'A clean product catalog photo of a slim laptop with a wireless mouse and keyboard, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-tv':                 'A clean product catalog photo of a modern flat-screen television on a stand, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-appliances':         'A clean product catalog photo of small home appliances — a coffee machine and a blender, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
  'elec-mobility':           'A clean product catalog photo of an electric scooter, pure white seamless background, soft studio lighting, e-commerce style, photorealistic, no text',
}

async function getOpenAI() {
  const { data } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  return new OpenAI({ apiKey: data.value })
}

async function genOne(openai, slug, prompt, idx) {
  const r = await openai.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024', quality: 'medium', n: 1 })
  const buf = Buffer.from(r.data[0].b64_json, 'base64')
  const path = `families/${slug}-${idx}-${Date.now()}.png`
  const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: 'image/png', upsert: true })
  if (up.error) throw new Error(up.error.message)
  return sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
}

async function main() {
  const test = process.argv[2] === '--test'
  const openai = await getOpenAI()

  if (test) {
    const url = await genOne(openai, 'elec-smartphones', FAMILIES['elec-smartphones'], 0)
    console.log('TEST OK:', url)
    return
  }

  // 1) Generate family images + set category image_url
  const familyUrls = {}
  for (const [slug, prompt] of Object.entries(FAMILIES)) {
    const urls = []
    for (let i = 0; i < VARIANTS; i++) {
      try { urls.push(await genOne(openai, slug, prompt, i)); process.stdout.write(`  ${slug} #${i} ✓\n`) }
      catch (e) { console.log(`  ${slug} #${i} ✗`, e.message.slice(0, 80)) }
    }
    if (!urls.length) { console.log('!! no images for', slug); continue }
    familyUrls[slug] = urls
    await sb.from('categories').update({ image_url: urls[0] }).eq('slug', slug)
  }
  console.log('families generated:', Object.keys(familyUrls).length)

  // 2) EuroTech products + their category slug
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%EuroTech%').maybeSingle()
  const prods = []
  let from = 0
  for (;;) {
    const { data } = await sb.from('products').select('id, categories(slug)').eq('supplier_id', sup.id).range(from, from + 999)
    if (!data || !data.length) break
    prods.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  console.log('EuroTech products:', prods.length)

  // 3) Which already have an image? (chunked IN query)
  const ids = prods.map((p) => p.id)
  const hasImg = new Set()
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200)
    const { data } = await sb.from('product_images').select('product_id').in('product_id', chunk)
    for (const r of (data || [])) hasImg.add(r.product_id)
  }
  console.log('already have image:', hasImg.size)

  // 4) Insert family image for the rest
  const counter = {}
  const toInsert = []
  for (const p of prods) {
    if (hasImg.has(p.id)) continue
    const slug = (p.categories && p.categories.slug) || 'elec-mobile-accessories'
    const urls = familyUrls[slug] || familyUrls['elec-mobile-accessories']
    if (!urls) continue
    counter[slug] = (counter[slug] || 0) + 1
    const url = urls[counter[slug] % urls.length]
    toInsert.push({ product_id: p.id, url, sort_order: 0 })
  }
  console.log('rows to insert:', toInsert.length)
  let ok = 0
  for (let i = 0; i < toInsert.length; i += 200) {
    const { error } = await sb.from('product_images').insert(toInsert.slice(i, i + 200))
    if (error) { console.log('insert err @' + i, error.message); break }
    ok += Math.min(200, toInsert.length - i)
  }
  console.log('INSERTED images:', ok)
}
main().catch((e) => console.log('ERR', e.message))
