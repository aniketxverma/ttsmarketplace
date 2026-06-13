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

// The 2 paid membership plans. Edit amount_eur here if your prices change.
// lookup keys encode the amount so re-running with new prices creates fresh ones.
const PLANS = [
  { tier: 'standard', name: 'TTAI EMA — Business', amount_eur: 79,  env: 'STRIPE_PRICE_STANDARD', lookup: 'ttai_business_79' },
  { tier: 'pro',      name: 'TTAI EMA — Pro',      amount_eur: 199, env: 'STRIPE_PRICE_PRO',      lookup: 'ttai_pro_199' },
]

// The 2 flagship TTAI ON programs. These get a product + recurring price AND a
// shareable Stripe Payment Link (a hosted checkout URL you can put on a button),
// since they have no in-app checkout flow.
//   • Business Growth: €2,125 every 4 months (€8,500 total over the 4 installments)
//   • The Fair:        €35,000 per year (note: normally paid by bank transfer)
const FLAGSHIPS = [
  {
    key: 'business_growth',
    name: 'TTAI ON — Business Growth',
    amount_eur: 2125,
    interval: 'month',
    interval_count: 4,
    lookup: 'ttai_business_growth',
    env: 'STRIPE_PRICE_BUSINESS_GROWTH',
  },
  {
    key: 'the_fair',
    name: 'TTAI ON — The Fair',
    amount_eur: 35000,
    interval: 'year',
    interval_count: 1,
    lookup: 'ttai_the_fair',
    env: 'STRIPE_PRICE_THE_FAIR',
  },
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
  const lookupKey = plan.lookup || `ttai_${plan.tier}_monthly`

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
    transfer_lookup_key: true, // steal the key from any archived/old price so re-runs work
    metadata: { ttai_tier: plan.tier },
  })
  console.log(`  ✓ ${plan.tier.padEnd(9)} create ${price.id}  (€${plan.amount_eur}/mo)`)
  return { env: plan.env, priceId: price.id }
}

async function ensureFlagship(fp) {
  // 1. Price (reuse by lookup_key, else create product + recurring price).
  let priceId
  const existing = await stripe.prices.list({ lookup_keys: [fp.lookup], active: true, limit: 1 })
  if (existing.data.length) {
    priceId = existing.data[0].id
    console.log(`  ↺ ${fp.key.padEnd(16)} reuse  ${priceId}`)
  } else {
    const product = await stripe.products.create({ name: fp.name, metadata: { ttai_plan: fp.key } })
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: fp.amount_eur * 100,
      recurring: { interval: fp.interval, interval_count: fp.interval_count },
      lookup_key: fp.lookup,
      transfer_lookup_key: true,
      metadata: { ttai_plan: fp.key },
    })
    priceId = price.id
    const every = fp.interval_count > 1 ? `${fp.interval_count} ${fp.interval}s` : fp.interval
    console.log(`  ✓ ${fp.key.padEnd(16)} create ${priceId}  (€${fp.amount_eur.toLocaleString()}/${every})`)
  }

  // 2. Payment Link (reuse one tagged with this plan's metadata, else create).
  const links = await stripe.paymentLinks.list({ limit: 100 })
  let link = links.data.find((l) => l.active && l.metadata && l.metadata.ttai_plan === fp.key)
  if (!link) {
    link = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { ttai_plan: fp.key },
    })
    console.log(`     + payment link ${link.url}`)
  } else {
    console.log(`     ↺ payment link ${link.url}`)
  }

  return { env: fp.env, priceId, url: link.url }
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

  console.log('Membership plans:')
  const results = []
  for (const plan of PLANS) results.push(await ensurePlan(plan))

  console.log('\nFlagship programs (TTAI ON):')
  const flagshipResults = []
  for (const fp of FLAGSHIPS) flagshipResults.push(await ensureFlagship(fp))

  console.log('\nWebhook:')
  const whSecret = await ensureWebhook()

  // ── Print the env block to paste into Vercel ──────────────────────────────
  console.log('\n────────────────────────────────────────────────────────────')
  console.log(`  Paste into Vercel → Settings → Environment Variables (${MODE}):`)
  console.log('────────────────────────────────────────────────────────────')
  console.log(`STRIPE_SECRET_KEY=${KEY.slice(0, 12)}…   (your full key — keep it secret)`)
  for (const r of results) console.log(`${r.env}=${r.priceId}`)
  for (const r of flagshipResults) console.log(`${r.env}=${r.priceId}`)
  if (whSecret) console.log(`STRIPE_WEBHOOK_SECRET=${whSecret}`)
  else console.log(`STRIPE_WEBHOOK_SECRET=<existing — see note above>`)
  console.log(`NEXT_PUBLIC_APP_URL=${APP_URL}`)
  console.log('────────────────────────────────────────────────────────────')

  // ── Flagship payment links (put these on the TTAI ON buttons) ─────────────
  console.log('\n  TTAI ON payment links (share or put on the “Buy / Join” buttons):')
  for (const r of flagshipResults) console.log(`    ${r.env.replace('STRIPE_PRICE_', '').toLowerCase().padEnd(16)} ${r.url}`)
  console.log('  Note: The Fair is normally paid by bank transfer — its link is optional.')

  console.log('\n✅ Done. Paste the env block into Vercel and redeploy.\n')
}

main().catch((e) => { console.error('\n❌ Setup failed:', e.message, '\n'); process.exit(1) })
