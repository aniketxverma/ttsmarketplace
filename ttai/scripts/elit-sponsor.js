require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Summer promotion: boost Elit Cooling (fans / coolers / portable AC) to the top
// of the Electronics category via sponsored_placements until end of summer 2026.
const SUP = '3a25e3d0-acb8-499c-bdd7-c744d3ad63d7'
const ENDS = '2026-09-30T23:59:59Z'

async function main() {
  const { data: ps } = await sb.from('products').select('id, category_id').eq('supplier_id', SUP)
  await sb.from('sponsored_placements').delete().in('product_id', ps.map((p) => p.id)) // idempotent
  const rows = ps.map((p) => ({
    kind: 'product', product_id: p.id, category_id: p.category_id, supplier_id: SUP,
    weight: 100, is_active: true, starts_at: new Date().toISOString(), ends_at: ENDS,
  }))
  const ins = await sb.from('sponsored_placements').insert(rows).select('id')
  if (ins.error) { console.log('ERR', ins.error.message); return }
  console.log(`Sponsored ${ins.data.length} Elit cooling products — summer boost until ${ENDS}.`)
}
main().catch((e) => console.log('ERR', e.message))
