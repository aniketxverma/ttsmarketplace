require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Hold every shop with NO products UNDER_REVIEW (not shown to buyers). Skips our
// own house brands. Pass APPLY=1 to actually update; default is a dry run.
// (Emails are sent by the daily /api/cron/onboarding-review job after deploy.)
const APPLY = process.env.APPLY === '1'

async function main() {
  const { data: suppliers } = await sb.from('suppliers').select('id, trade_name, status, is_house')
  const { data: prodRows } = await sb.from('products').select('supplier_id')
  const counts = new Map()
  for (const p of prodRows || []) counts.set(p.supplier_id, (counts.get(p.supplier_id) || 0) + 1)

  const blankActive = (suppliers || []).filter((s) => !s.is_house && s.status === 'ACTIVE' && (counts.get(s.id) || 0) === 0)
  console.log(`ACTIVE non-house shops with 0 products: ${blankActive.length}`)
  blankActive.slice(0, 40).forEach((s) => console.log('  ·', s.trade_name))
  if (blankActive.length > 40) console.log(`  … +${blankActive.length - 40} more`)

  if (!APPLY) { console.log('\nDRY RUN — re-run with APPLY=1 to set these UNDER_REVIEW.'); return }
  const ids = blankActive.map((s) => s.id)
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await sb.from('suppliers').update({ status: 'UNDER_REVIEW' }).in('id', ids.slice(i, i + 100))
    if (error) { console.log('  err', error.message); break }
  }
  console.log(`\nSet ${ids.length} shops UNDER_REVIEW. Onboarding emails go out via the daily cron.`)
}
main().catch((e) => console.log('ERR', e.message))
