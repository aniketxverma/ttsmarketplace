import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { regionKeysFor } from '@/lib/regions-map'

/**
 * Auto-place a supplier into supplier_regions based on their profile's
 * continent + country. Called after onboarding and can be re-run safely.
 */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, continent, country_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'supplier') {
    return NextResponse.json({ ok: true, skipped: 'not a supplier' })
  }

  const { data: sup } = await admin.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
  if (!sup?.id) return NextResponse.json({ ok: true, skipped: 'no supplier record' })

  const keys = regionKeysFor(profile.continent, profile.country_name)
  if (keys.length === 0) return NextResponse.json({ ok: true, keys: [] })

  const { error } = await (admin.from('supplier_regions') as any).upsert(
    keys.map((region_key) => ({ supplier_id: sup.id, region_key })),
    { onConflict: 'supplier_id,region_key' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, keys })
}
