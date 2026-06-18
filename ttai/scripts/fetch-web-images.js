require('dotenv').config({ path: '.env.local' })
const https = require('https')
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function get(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('too many redirects'))
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...headers }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href
        return resolve(get(next, headers, redirects + 1))
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)) }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ buf: Buffer.concat(chunks), ct: res.headers['content-type'] || '', headers: res.headers }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}

// DuckDuckGo image search → array of { image, width, height }.
async function searchImages(query) {
  const ref = 'https://duckduckgo.com/?q=' + encodeURIComponent(query) + '&iax=images&ia=images'
  const page = await get(ref)
  const cookie = (page.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ')
  const vqd = (page.buf.toString('utf8').match(/vqd=\"?([0-9-]+)\"?/) || [])[1]
  if (!vqd) throw new Error('no vqd')
  const api = 'https://duckduckgo.com/i.js?l=us-en&o=json&q=' + encodeURIComponent(query) + '&vqd=' + vqd + '&f=,,,&p=1&v7exp=a'
  const r = await get(api, {
    Referer: ref, Accept: 'application/json, text/javascript, */*; q=0.01', 'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'same-origin', Cookie: cookie,
  })
  return (JSON.parse(r.buf.toString('utf8')).results || []).map((x) => ({ image: x.image, width: x.width, height: x.height }))
}

const extFromCt = (ct, url) => /png/i.test(ct) || /\.png/i.test(url) ? '.png' : /webp/i.test(ct) || /\.webp/i.test(url) ? '.webp' : '.jpg'
const GOOD = /media-amazon|samsung|apple|mi\.com|xiaomi|redmi|mediamarkt|ldlc|gsmarena|fnac|coolblue|pccomponentes|cdn|shopify|alicdn|backmarket|phonehouse/i

// Fetch up to `count` valid images for a query. Prefers reputable, large-enough images.
async function fetchImages(query, { count = 1, min = 9000, max = 6_000_000, minDim = 300 } = {}) {
  let results = []
  try { results = await searchImages(query) } catch (e) { console.log('   search err:', e.message); return [] }
  // Keep DuckDuckGo's relevance order (top result = correct model); only push
  // obvious junk/tiny images to the back so the main shot stays accurate.
  results = results.filter((r) => r.image && !/\.svg($|\?)/i.test(r.image) && !/sprite|logo-|icon/i.test(r.image))
  const out = []
  for (const r of results) {
    if (out.length >= count) break
    const url = r.image
    if (!url || /\.svg($|\?)/i.test(url) || /sprite|logo-|icon/i.test(url)) continue
    if (r.width && r.width < minDim) continue
    try {
      const { buf, ct } = await get(url, { Referer: 'https://duckduckgo.com/' })
      if (!/image\//i.test(ct)) continue
      if (buf.length < min || buf.length > max) continue
      out.push({ buf, ext: extFromCt(ct, url), src: url })
    } catch { /* try next */ }
  }
  return out
}

async function upload(buf, dest, ext) {
  const ctype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const up = await sb.storage.from('brand-assets').upload(dest, buf, { contentType: ctype, upsert: true })
  if (up.error) { console.log('   upload err:', up.error.message); return null }
  return sb.storage.from('brand-assets').getPublicUrl(dest).data.publicUrl
}

module.exports = { fetchImages, upload, sb, sleep }

if (require.main === module) {
  const q = process.argv.slice(2).join(' ') || 'Samsung Galaxy A56 5G smartphone'
  fetchImages(q, { count: 2 }).then((r) => { console.log('got', r.length, 'images'); r.forEach((x) => console.log('  ', x.buf.length, 'bytes', x.ext, x.src.slice(0, 90))) })
}
