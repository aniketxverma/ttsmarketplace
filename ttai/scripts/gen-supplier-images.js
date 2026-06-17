require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Tailored storefront prompts per supplier (matched by trade_name, case-insensitive).
const PROMPTS = {
  chtaura: 'A realistic modern Lebanese Mediterranean specialty food store storefront, large glass shop window displaying jars of hummus, olives, jams, tahini and canned foods on warm wooden shelves, elegant illuminated sign, professional retail photography, daytime, wide angle, photorealistic',
  createl: 'A realistic modern consumer electronics and audio accessories shop storefront, glass window displaying headphones, bluetooth speakers, chargers and gadgets, blue LED signage, clean professional retail photography, daytime, wide angle, photorealistic',
  iphone: 'A sleek minimalist Apple iPhone retail store storefront, white and glass facade displaying rows of smartphones, bright modern lighting, professional retail photography, daytime, wide angle, photorealistic',
  xo: 'A busy wholesale electronics and mobile accessories store storefront, glass window displaying phone cases, cables, power banks and earbuds, bright colorful signage, professional retail photography, daytime, wide angle, photorealistic',
  rozil: 'A clean household cleaning products shop storefront, glass window displaying colorful detergent, softener and cleaner bottles on tidy shelves, fresh bright look, professional retail photography, daytime, wide angle, photorealistic',
  viscosity: 'An automotive motor oil and lubricants shop storefront, glass window displaying engine oil bottles and metal drums, industrial professional look, professional photography, daytime, wide angle, photorealistic',
  eurotech: 'A large modern electronics megastore storefront, sleek glass facade displaying smartphones, tablets, televisions and laptops, blue illuminated signage, professional retail photography, daytime, wide angle, photorealistic',
}

async function main() {
  const { data: keyRow } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  const openai = new OpenAI({ apiKey: keyRow.value })

  const { data: sups } = await sb.from('suppliers').select('id, trade_name, legal_name, banner_image').eq('status', 'ACTIVE')
  for (const s of sups) {
    const key = Object.keys(PROMPTS).find((k) => (`${s.trade_name} ${s.legal_name}`).toLowerCase().includes(k))
    if (!key) { console.log('skip (no prompt):', s.trade_name); continue }
    if (process.argv[2] !== '--force' && s.banner_image) { console.log('has banner, skip:', s.trade_name); continue }
    try {
      const r = await openai.images.generate({ model: 'gpt-image-1', prompt: PROMPTS[key], size: '1536x1024', quality: 'medium', n: 1 })
      const b64 = r.data[0].b64_json
      const buf = Buffer.from(b64, 'base64')
      const path = `storefronts/${key}-${Date.now()}.png`
      const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: 'image/png', upsert: true })
      if (up.error) { console.log('upload err', s.trade_name, up.error.message); continue }
      const url = sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
      await sb.from('suppliers').update({ banner_image: url }).eq('id', s.id)
      console.log('✓ generated + set banner:', s.trade_name)
    } catch (e) { console.log('✗ gen fail', s.trade_name, e.status || '', e.message.slice(0, 90)) }
  }
  console.log('done')
}
main().catch((e) => console.log('ERR', e.message))
