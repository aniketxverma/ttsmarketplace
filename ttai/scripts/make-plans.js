// Create (or reuse) the membership plan prices in Stripe and print their IDs.
//   Business €79/mo  → STRIPE_PRICE_STANDARD
//   Pro      €199/mo → STRIPE_PRICE_PRO
//
// Reads STRIPE_SECRET_KEY from .env.local. Safe to re-run (reuses by lookup_key).
//   node scripts/make-plans.js

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const KEY = process.env.STRIPE_SECRET_KEY
if (!KEY) { console.error('❌ STRIPE_SECRET_KEY missing in .env.local'); process.exit(1) }
const stripe = new Stripe(KEY, { apiVersion: '2024-04-10' })
const MODE = KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'

const PLANS = [
  { name: 'TTAI EMA — Business', amount_eur: 79,  env: 'STRIPE_PRICE_STANDARD', lookup: 'ttai_business_79' },
  { name: 'TTAI EMA — Pro',      amount_eur: 199, env: 'STRIPE_PRICE_PRO',      lookup: 'ttai_pro_199' },
]

async function ensure(plan) {
  const found = await stripe.prices.list({ lookup_keys: [plan.lookup], active: true, limit: 1 })
  if (found.data.length) {
    console.log(`  ↺ ${plan.env.padEnd(22)} reuse  ${found.data[0].id}  (€${found.data[0].unit_amount / 100}/mo)`)
    return { env: plan.env, id: found.data[0].id }
  }
  const product = await stripe.products.create({ name: plan.name })
  const price = await stripe.prices.create({
    product: product.id, currency: 'eur', unit_amount: plan.amount_eur * 100,
    recurring: { interval: 'month' }, lookup_key: plan.lookup, transfer_lookup_key: true,
  })
  console.log(`  ✓ ${plan.env.padEnd(22)} create ${price.id}  (€${plan.amount_eur}/mo)`)
  return { env: plan.env, id: price.id }
}

;(async () => {
  console.log(`\n🔧 Membership plans — ${MODE} mode\n`)
  try { await stripe.balance.retrieve() }
  catch (e) { console.error('❌ Stripe key rejected:', e.message); process.exit(1) }
  const out = []
  for (const p of PLANS) out.push(await ensure(p))
  console.log('\n─── Paste into env (Hostinger + .env.local) ───')
  for (const r of out) console.log(`${r.env}=${r.id}`)
  console.log('───────────────────────────────────────────────\n')
})()
