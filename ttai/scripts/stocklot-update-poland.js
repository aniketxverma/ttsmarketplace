require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PL = '46747925-dbe0-4745-bf24-f2179b7fb69e'
const MEDIA = 'C:/Users/anike/Downloads/WhatsApp Unknown 2026-06-18 at 17.11.14'
const VIDEO = 'WhatsApp Video 2026-06-18 at 17.04.25.mp4' // the 0:28 clip shown in chat

const ctype = (f) => /\.png$/i.test(f) ? 'image/png' : /\.mp4$/i.test(f) ? 'video/mp4' : 'image/jpeg'
async function up(localPath, dest) {
  const buf = fs.readFileSync(localPath)
  const r = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype(localPath), upsert: true })
  if (r.error) { console.log('  upload err', dest, r.error.message); return null }
  return sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
}
const toPoland = (s) => (s || '').replace(/Germany ?\/ ?EU/g, 'Poland').replace(/Germany/g, 'Poland')

async function main() {
  // 1) Supplier origin → Poland
  const { data: sup } = await sb.from('suppliers').select('id').ilike('legal_name', '%TTAIEMA Stock Lots%').single()
  await sb.from('suppliers').update({ country_id: PL }).eq('id', sup.id)
  console.log('supplier → Poland')

  // 2) Upload the warehouse video (shared — same Poland supplier)
  const videoUrl = await up(path.join(MEDIA, VIDEO), 'stocklots/stocklot-video.mp4')
  console.log('video:', !!videoUrl)

  // 3) LIDL lot — keep its real Lidl photos, just origin → Poland + video
  const { data: lidl } = await sb.from('products').select('id, name, description').ilike('slug', 'lidl-returns-33%').single()
  await sb.from('products').update({
    name: lidl.name.replace('(Germany)', '(Poland)'),
    description: toPoland(lidl.description),
    country_of_origin: 'Poland', video_url: videoUrl,
  }).eq('id', lidl.id)
  console.log('LIDL → Poland + video')

  // 4) Amazon lot — replace web images with the 11 real photos + origin → Poland + video
  const { data: fba } = await sb.from('products').select('id, description').ilike('slug', 'amazon-fba-returns-66%').single()
  await sb.from('products').update({
    description: toPoland(fba.description), country_of_origin: 'Poland', video_url: videoUrl,
  }).eq('id', fba.id)

  await sb.from('product_images').delete().eq('product_id', fba.id) // remove old web-fetched images
  const photos = fs.readdirSync(MEDIA).filter(f => /\.jpe?g$/i.test(f))
    .map(f => ({ f, size: fs.statSync(path.join(MEDIA, f)).size }))
    .sort((a, b) => b.size - a.size) // largest/clearest first
  let n = 0
  for (const { f } of photos) {
    const url = await up(path.join(MEDIA, f), `stocklots/amazon-real/${fba.id}-${n}.jpg`)
    if (url) { await sb.from('product_images').insert({ product_id: fba.id, url, sort_order: n }); n++ }
  }
  console.log('Amazon → Poland + video, real photos:', n)
  console.log('DONE')
}
main().catch((e) => console.log('ERR', e.message))
