require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// One pallet/warehouse photo per Outlet opportunity banner. Stored in app_settings
// as outlet_banner_<key>; the /outlet page reads them as banner backgrounds.
const PROMPTS = {
  brand_new:   'A warehouse pallet stacked with brand-new boxed consumer electronics, clean professional wholesale photography, bright lighting, photorealistic, wide',
  clearance:   'A retail clearance warehouse aisle with pallets of discounted boxed products and clearance signage, professional photography, photorealistic, wide',
  returns:     'Pallets of customer-returned consumer electronics in a returns warehouse, some opened boxes, professional liquidation photography, photorealistic, wide',
  refurbished: 'Refurbished smartphones, laptops and electronics neatly arranged on a workbench in a refurbishment facility, professional photography, photorealistic, wide',
  overstock:   'A large warehouse aisle full of overstock pallets and cardboard boxes stacked high, professional logistics photography, photorealistic, wide',
  mixed:       'A mixed pallet of assorted boxed consumer goods shrink-wrapped in a wholesale liquidation warehouse, professional photography, photorealistic, wide',
}

async function main() {
  const { data: keyRow } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  const openai = new OpenAI({ apiKey: keyRow.value })
  for (const [key, prompt] of Object.entries(PROMPTS)) {
    try {
      const r = await openai.images.generate({ model: 'gpt-image-1', prompt, size: '1536x1024', quality: 'medium', n: 1 })
      const buf = Buffer.from(r.data[0].b64_json, 'base64')
      const path = `outlet-banners/${key}-${Date.now()}.png`
      const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: 'image/png', upsert: true })
      if (up.error) { console.log('upload err', key, up.error.message); continue }
      const url = sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
      await sb.from('app_settings').upsert({ key: `outlet_banner_${key}`, value: url }, { onConflict: 'key' })
      console.log('✓', key)
    } catch (e) { console.log('✗', key, e.message.slice(0, 80)) }
  }
  console.log('done')
}
main().catch((e) => console.log('ERR', e.message))
