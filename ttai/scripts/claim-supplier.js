#!/usr/bin/env node
/**
 * Link a supplier (by brand_slug) to a user account (by email) so that user
 * can manage its products from the supplier dashboard.
 *
 * Usage:
 *   node scripts/claim-supplier.js <email> [brand_slug]
 *   node scripts/claim-supplier.js me@example.com rozil
 *
 * It will:
 *   1. Find the auth user by email
 *   2. Set their profile role = 'supplier' + approval_status = 'approved'
 *   3. Set suppliers.owner_id = that user (and status = 'ACTIVE')
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.argv[2]
const SLUG = (process.argv[3] || 'rozil').toLowerCase()

if (!URL || !KEY) { console.error('❌ Missing Supabase env vars in .env.local'); process.exit(1) }
if (!EMAIL)       { console.error('❌ Usage: node scripts/claim-supplier.js <email> [brand_slug]'); process.exit(1) }

const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function findUserByEmail(email) {
  // Paginate through auth users to find a matching email (case-insensitive)
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < 200) break
  }
  return null
}

async function run() {
  console.log(`\n→ Claiming supplier "${SLUG}" for ${EMAIL}\n`)

  // 1. Find user
  const user = await findUserByEmail(EMAIL)
  if (!user) { console.error(`❌ No account found for ${EMAIL}. Register/log in first, then re-run.`); process.exit(1) }
  console.log(`✅ User found: ${user.id}`)

  // 2. Promote profile to approved supplier
  const { error: pErr } = await sb.from('profiles')
    .update({ role: 'supplier', approval_status: 'approved' })
    .eq('id', user.id)
  console.log(pErr ? `❌ profile: ${pErr.message}` : '✅ Profile set to supplier + approved')

  // 3. Find supplier
  const { data: sup, error: sErr } = await sb.from('suppliers')
    .select('id, owner_id, trade_name, status')
    .eq('brand_slug', SLUG)
    .maybeSingle()
  if (sErr) { console.error(`❌ supplier lookup: ${sErr.message}`); process.exit(1) }
  if (!sup) { console.error(`❌ No supplier with brand_slug = "${SLUG}"`); process.exit(1) }
  console.log(`✅ Supplier found: ${sup.trade_name} (${sup.id}) — current owner ${sup.owner_id ?? 'none'}`)

  // 4. Assign ownership + activate
  const { error: oErr } = await sb.from('suppliers')
    .update({ owner_id: user.id, status: 'ACTIVE' })
    .eq('id', sup.id)
  console.log(oErr ? `❌ owner: ${oErr.message}` : `✅ Supplier owner_id → ${user.id}, status ACTIVE`)

  const { count } = await sb.from('products')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', sup.id)
  console.log(`\n✅ Done. ${EMAIL} now manages ${sup.trade_name} (${count ?? 0} products) at /supplier/products`)
}

run().catch(e => { console.error(e); process.exit(1) })
