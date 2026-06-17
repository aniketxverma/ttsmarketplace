require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PROMPT = 'A wide cinematic isometric 3D illustration of a global B2B trade and supplier network: modern warehouses, factories, cargo containers, a container ship and delivery trucks connected by glowing routes across a stylized dark world map, deep navy blue (#0B1F4D) background with warm gold (#F5A623) glowing accents and light trails, clean modern corporate style, depth and soft lighting, no text, banner composition'

async function main() {
  const { data } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  const openai = new OpenAI({ apiKey: data.value })
  const r = await openai.images.generate({ model: 'gpt-image-1', prompt: PROMPT, size: '1536x1024', quality: 'medium', n: 1 })
  const buf = Buffer.from(r.data[0].b64_json, 'base64')
  const path = `hero/suppliers-hero-${Date.now()}.png`
  const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: 'image/png', upsert: true })
  if (up.error) throw new Error(up.error.message)
  const url = sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
  await sb.from('app_settings').upsert({ key: 'suppliers_hero_url', value: url }, { onConflict: 'key' })
  console.log('HERO:', url)
}
main().catch((e) => console.log('ERR', e.message))
