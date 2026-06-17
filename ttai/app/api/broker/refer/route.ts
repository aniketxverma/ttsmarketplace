import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { POINTS_PER_REFERRAL } from '@/lib/broker'

/**
 * Register a Supplier or Buyer reference under the logged-in broker. The company
 * stays permanently linked to this broker (protected network) and the broker
 * earns Connection Points.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: broker } = await admin.from('brokers').select('id, connection_points').eq('user_id', user.id).maybeSingle()
  if (!broker) return NextResponse.json({ error: 'No broker profile found. Register as a broker first.' }, { status: 404 })

  const b = await req.json().catch(() => ({})) as Record<string, string>
  const companyType = b.companyType === 'buyer' ? 'buyer' : 'supplier'
  if (!b.companyName?.trim()) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 })

  const row = {
    broker_id: (broker as any).id,
    company_type: companyType,
    company_name: b.companyName.trim(),
    contact_name: b.contactName?.trim() || null,
    contact_email: b.contactEmail?.trim() || null,
    contact_phone: b.contactPhone?.trim() || null,
    country_name: b.countryName?.trim() || null,
    category: b.category?.trim() || null,
    notes: b.notes?.trim() || null,
    status: 'registered',
    points: POINTS_PER_REFERRAL,
  }

  const { error } = await (admin.from('broker_referrals') as any).insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Award connection points.
  await (admin.from('brokers') as any)
    .update({ connection_points: ((broker as any).connection_points ?? 0) + POINTS_PER_REFERRAL })
    .eq('id', (broker as any).id)

  return NextResponse.json({ ok: true, points: POINTS_PER_REFERRAL })
}
