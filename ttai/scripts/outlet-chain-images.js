const { fetchImages, upload, sb, sleep } = require('./fetch-web-images')

// Official brand LOGOS for the "Shop by retail chain" banners. Logos (unlike
// storefront stock photos) are almost always watermark-free. Stored in
// app_settings as outlet_banner_chainlogo_<match> (read by the Outlet page).
const CHAINS = [
  { match: 'amazon', q: 'Amazon logo' },
  { match: 'lidl', q: 'Lidl logo' },
  { match: 'aldi', q: 'Aldi logo' },
  { match: 'carrefour', q: 'Carrefour logo' },
  { match: 'mediamarkt', q: 'MediaMarkt logo' },
  { match: 'costco', q: 'Costco logo' },
  { match: 'walmart', q: 'Walmart logo' },
  { match: 'tesco', q: 'Tesco logo' },
  { match: 'metro', q: 'Metro cash and carry logo' },
  { match: 'corte', q: 'El Corte Ingles logo' },
]

async function setSetting(key, value) {
  const { data } = await sb.from('app_settings').select('key').eq('key', key).maybeSingle()
  if (data) await sb.from('app_settings').update({ value }).eq('key', key)
  else await sb.from('app_settings').insert({ key, value })
}

async function main() {
  let n = 0
  for (const c of CHAINS) {
    const imgs = await fetchImages(c.q + ' png', { count: 1, min: 2500, minDim: 120 })
    const img = imgs[0]
    if (!img) { console.log('✗ no logo:', c.match); await sleep(600); continue }
    const url = await upload(img.buf, `outlet-chains/logo-${c.match}${img.ext}`, img.ext)
    if (!url) { await sleep(600); continue }
    await setSetting(`outlet_banner_chainlogo_${c.match}`, url)
    // Retire any old watermarked storefront-photo setting.
    await sb.from('app_settings').delete().eq('key', `outlet_banner_chain_${c.match}`)
    console.log('✓', c.match, '←', c.q)
    n++
    await sleep(700)
  }
  console.log(`\nDONE · retail-chain logos set: ${n}/${CHAINS.length}`)
}
main().catch((e) => console.log('ERR', e.message))
