require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PROMPT = 'A friendly futuristic AI robot assistant mascot head, navy blue (#0B1F4D) body with gold (#F5A623) accents, big friendly glowing eyes, clean modern 3D render, centered, on a transparent-looking soft white background, professional corporate mascot, circular composition, no text'

async function main() {
  const { data } = await sb.from('app_settings').select('value').eq('key', 'translation_openai_key').single()
  const openai = new OpenAI({ apiKey: data.value })
  const r = await openai.images.generate({ model: 'gpt-image-1', prompt: PROMPT, size: '1024x1024', quality: 'medium', n: 1 })
  const buf = Buffer.from(r.data[0].b64_json, 'base64')
  const path = `assistant/ttai-avatar-${Date.now()}.png`
  const up = await sb.storage.from('brand-assets').upload(path, buf, { contentType: 'image/png', upsert: true })
  if (up.error) throw new Error(up.error.message)
  const url = sb.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
  await sb.from('app_settings').upsert({ key: 'assistant_avatar_url', value: url }, { onConflict: 'key' })
  console.log('AVATAR:', url)
}
main().catch((e) => console.log('ERR', e.message))
