// Apply migration 0015 — adds shop columns to supplier_pos and creates pos_private_details
// Run: node scripts/apply-migration-0015.js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔧 Migration 0015 — Client Shops\n')

  // Test connection
  const { error: connErr } = await sb.from('suppliers').select('id').limit(1)
  if (connErr) { console.error('❌ Connection failed:', connErr.message); process.exit(1) }
  console.log('✅ Connected to Supabase\n')

  // Check if shop_active column already exists
  const { data: test, error: colErr } = await sb
    .from('supplier_pos')
    .select('id, shop_active')
    .limit(1)

  if (!colErr) {
    console.log('✅ shop_active column already exists — skipping ALTER TABLE')
  } else if (colErr.message.includes('column "shop_active"')) {
    console.log('⚠️  shop_active column missing — need to run SQL migration manually')
    console.log('   Go to Supabase Dashboard → SQL Editor and run:\n')
    console.log(`ALTER TABLE supplier_pos
  ADD COLUMN IF NOT EXISTS shop_active  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_slug    TEXT,
  ADD COLUMN IF NOT EXISTS shop_name    TEXT,
  ADD COLUMN IF NOT EXISTS shop_tagline TEXT,
  ADD COLUMN IF NOT EXISTS shop_logo    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_pos_shop_slug
  ON supplier_pos (shop_slug)
  WHERE shop_slug IS NOT NULL;`)
    console.log('')
  } else {
    console.log('⚠️  Unexpected error checking columns:', colErr.message)
  }

  // Check if pos_private_details table exists
  const { error: privCheckErr } = await sb
    .from('pos_private_details')
    .select('id')
    .limit(1)

  if (!privCheckErr) {
    console.log('✅ pos_private_details table already exists')
  } else if (privCheckErr.message.includes('relation')) {
    console.log('⚠️  pos_private_details table missing — need to run SQL migration manually')
    console.log('   Add to the SQL Editor script above:\n')
    console.log(`CREATE TABLE IF NOT EXISTS pos_private_details (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_id   UUID NOT NULL REFERENCES supplier_pos(id) ON DELETE CASCADE UNIQUE,
  phone    TEXT,
  whatsapp TEXT,
  notes    TEXT
);

ALTER TABLE pos_private_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_priv_auth_read" ON pos_private_details
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "pos_priv_supplier_write" ON pos_private_details FOR ALL
  USING  (pos_id IN (
    SELECT sp.id FROM supplier_pos sp
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE s.owner_id = auth.uid()
  ))
  WITH CHECK (pos_id IN (
    SELECT sp.id FROM supplier_pos sp
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE s.owner_id = auth.uid()
  ));`)
    console.log('')
  } else {
    console.log('✅ pos_private_details:', privCheckErr.message)
  }

  console.log('\n📋 Summary: run migration SQL in Supabase Dashboard → SQL Editor')
  console.log('   File: supabase/migrations/0015_client_shops.sql')
}

main().catch(e => { console.error(e); process.exit(1) })
