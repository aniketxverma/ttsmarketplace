require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Banner image per ROOT category for the marketplace catalogue cards + headers.
const PROMPTS = {
  'food-beverage':          'A wide professional banner photo of assorted food and beverage products — groceries, cans, bottles and jars neatly arranged on bright supermarket shelves, clean commercial photography, photorealistic',
  'electronics-technology': 'A wide professional banner photo of consumer electronics — smartphones, laptops, TVs and gadgets arranged in a modern technology store, clean bright lighting, photorealistic',
  'automotive-transport':   'A wide professional banner photo of automotive products — motor oil bottles, car parts and accessories in a clean auto-parts store, professional commercial photography, photorealistic',
  'cleaning-household':     'A wide professional banner photo of cleaning and household products — colourful detergent and spray bottles neatly arranged on tidy shelves, bright clean look, photorealistic',
}

async function main() {
  const { data: keyRow } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  const openai = new OpenAI({ apiKey: keyRow.value })
  const only = process.argv[2] // optional slug filter
  const { data: cats } = await sb.from('categories').select('id, slug, image_url').is('parent_id', null)
  for (const c of cats) {
    if (only && c.slug !== only) continue
    if (!PROMPTS[c.slug]) { console.log('no prompt:', c.slug); continue }
    if (c.image_url && process.argv[2] !== '--force') { console.log('has image:', c.slug); continue }
    try {
      const r = await openai.images.generate({ model: 'gpt-image-1', prompt: PROMPTS[c.slug], size: '1536x1024', quality: 'medium', n: 1 })
      const buf = Buffer.from(r.data[0].b64_json, 'base64')
      const path = `category-banners/${c.slug}-${Date.now()}.png`
      const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: 'image/png', upsert: true })
      if (up.error) { console.log('upload err', c.slug, up.error.message); continue }
      const url = sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
      await sb.from('categories').update({ image_url: url }).eq('id', c.id)
      console.log('✓', c.slug)
    } catch (e) { console.log('✗', c.slug, e.message.slice(0, 80)) }
  }
  console.log('done')
}
main().catch((e) => console.log('ERR', e.message))
