// ─────────────────────────────────────────────────────────────────────────────
// One-time Stripe setup for TTAI EMA membership plans.
//
// Creates (or reuses) the 3 recurring membership products + monthly prices and
// the webhook endpoint, then prints the env values to paste into Vercel.
//
// Your secret key NEVER leaves your machine — it is read from .env.local
// (which is gitignored). Nothing here is committed with a key in it.
//
// SETUP:
//   1. Put your Stripe TEST secret key in ttai/.env.local :
//        STRIPE_SECRET_KEY=sk_test_xxxxxxxx
//      (and your app URL, used for the webhook):
//        NEXT_PUBLIC_APP_URL=https://ttsmarketplace.vercel.app
//   2. Run:  node scripts/setup-stripe.js
//   3. Copy the printed env block into Vercel → Settings → Environment Variables.
//
// Re-running is safe: it reuses existing plans/prices (matched by lookup_key)
// and the existing webhook instead of creating duplicates.
//
// When you go LIVE: swap .env.local to your sk_live_ key and run it again to
// create the live-mode products + webhook, then update Vercel with the new IDs.
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const KEY = process.env.STRIPE_SECRET_KEY
if (!KEY) {
  console.error('\n❌ STRIPE_SECRET_KEY not found in .env.local')
  console.error('   Add a line:  STRIPE_SECRET_KEY=sk_test_xxxxxxxx\n')
  process.exit(1)
}
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://ttsmarketplace.vercel.app').replace(/\/$/, '')
const stripe = new Stripe(KEY, { apiVersion: '2024-04-10' })
const MODE = KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'

// The 3 paid membership plans. Edit amount_eur here if your prices change.
const PLANS = [
  { tier: 'standard', name: 'TTAI EMA — Standard', amount_eur: 49,  env: 'STRIPE_PRICE_STANDARD' },
  { tier: 'pro',      name: 'TTAI EMA — Pro',      amount_eur: 99,  env: 'STRIPE_PRICE_PRO' },
  { tier: 'full',     name: 'TTAI EMA — Full Pack', amount_eur: 199, env: 'STRIPE_PRICE_FULL' },
]

// Webhook events the app's /api/webhooks/stripe route handles.
const WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'checkout.session.completed',
  'account.updated',
]

async function ensurePlan(plan) {
  const lookupKey = `ttai_${plan.tier}_monthly`

  // Reuse an existing price with this lookup_key if present.
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
  if (existing.data.length) {
    const price = existing.data[0]
    console.log(`  ↺ ${plan.tier.padEnd(9)} reuse  ${price.id}  (€${(price.unit_amount / 100).toFixed(0)}/mo)`)
    return { env: plan.env, priceId: price.id }
  }

  // Otherwise create a product + recurring monthly price.
  const product = await stripe.products.create({
    name: plan.name,
    metadata: { ttai_tier: plan.tier },
  })
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: plan.amount_eur * 100,
    recurring: { interval: 'month' },
    lookup_key: lookupKey,
    metadata: { ttai_tier: plan.tier },
  })
  console.log(`  ✓ ${plan.tier.padEnd(9)} create ${price.id}  (€${plan.amount_eur}/mo)`)
  return { env: plan.env, priceId: price.id }
}

async function ensureWebhook() {
  const url = `${APP_URL}/api/webhooks/stripe`
  const list = await stripe.webhookEndpoints.list({ limit: 100 })
  const found = list.data.find((w) => w.url === url)
  if (found) {
    console.log(`  ↺ webhook  reuse  ${found.id}`)
    console.log(`     ⚠️  The signing secret (whsec_…) is only shown when an endpoint is FIRST created.`)
    console.log(`         If you don't have it saved, open the endpoint in Stripe → "Roll secret" to get a new one.`)
    return null
  }
  const wh = await stripe.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS })
  console.log(`  ✓ webhook  create ${wh.id}`)
  return wh.secret // whsec_… — only available right now, at creation
}

async function main() {
  console.log(`\n🔧 Stripe setup for TTAI EMA  —  ${MODE} mode`)
  console.log(`   App URL: ${APP_URL}\n`)

  // Sanity: confirm the key works.
  try { await stripe.balance.retrieve() }
  catch (e) { console.error('❌ Stripe key rejected:', e.message, '\n'); process.exit(1) }

  console.log('Plans:')
  const results = []
  for (const plan of PLANS) results.push(await ensurePlan(plan))

  console.log('\nWebhook:')
  const whSecret = await ensureWebhook()

  // ── Print the env block to paste into Vercel ──────────────────────────────
  console.log('\n────────────────────────────────────────────────────────────')
  console.log(`  Paste into Vercel → Settings → Environment Variables (${MODE}):`)
  console.log('────────────────────────────────────────────────────────────')
  console.log(`STRIPE_SECRET_KEY=${KEY.slice(0, 12)}…   (your full key — keep it secret)`)
  for (const r of results) console.log(`${r.env}=${r.priceId}`)
  if (whSecret) console.log(`STRIPE_WEBHOOK_SECRET=${whSecret}`)
  else console.log(`STRIPE_WEBHOOK_SECRET=<existing — see note above>`)
  console.log(`NEXT_PUBLIC_APP_URL=${APP_URL}`)
  console.log('────────────────────────────────────────────────────────────')
  console.log('\n✅ Done. After pasting into Vercel, redeploy so the vars take effect.\n')
}

main().catch((e) => { console.error('\n❌ Setup failed:', e.message, '\n'); process.exit(1) })
