// Apply migration 0015_client_shops.sql via Supabase SQL execution
// Run: node scripts/run-migration-0015.js
require('dotenv').config({ path: '.env.hostinger' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runSQL(sql, label) {
  const { error } = await sb.rpc('exec_sql', { sql }).catch(() => ({ error: { message: 'rpc not available' } }))
  if (error) {
    // Try via REST directly
    console.log(`  ⚙️  ${label}: via direct table check`)
    return false
  }
  console.log(`  ✅ ${label}`)
  return true
}

async function main() {
  console.log('🔧 Applying migration 0015_client_shops...\n')

  // Step 1: Add shop columns to supplier_pos
  // We use Supabase's PostgREST to check and then upsert test records
  // Since we can't run raw SQL, we do it by trying to use the columns

  // Test if shop_active column exists by trying to select it
  const { data: testPos, error: testErr } = await sb
    .from('supplier_pos')
    .select('id, shop_active, shop_slug, shop_name, shop_tagline')
    .limit(1)

  if (testErr && testErr.message.includes('column')) {
    console.log('⚠️  Migration columns not yet applied.')
    console.log('   Please apply the migration manually in Supabase SQL Editor:')
    console.log('   → Dashboard → SQL Editor → paste contents of:')
    console.log('   → supabase/migrations/0015_client_shops.sql')
    console.log('')
    console.log('   Or use the Supabase CLI:')
    console.log('   → supabase db push (if configured)')
  } else if (testErr) {
    console.log('⚠️  Could not verify columns:', testErr.message)
  } else {
    console.log('✅ supplier_pos shop columns exist (migration applied)')
  }

  // Step 2: Check pos_private_details table
  const { error: privErr } = await sb
    .from('pos_private_details')
    .select('id')
    .limit(1)

  if (privErr && privErr.message.includes('relation')) {
    console.log('⚠️  pos_private_details table not yet created.')
    console.log('   Apply migration 0015_client_shops.sql first.')
  } else if (privErr) {
    console.log('⚠️  pos_private_details check:', privErr.message)
  } else {
    console.log('✅ pos_private_details table exists')
  }

  console.log('\nDone. If migration is not applied, use Supabase Dashboard SQL Editor.')
}

main().catch(e => { console.error(e); process.exit(1) })
