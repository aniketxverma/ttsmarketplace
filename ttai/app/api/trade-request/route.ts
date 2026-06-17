import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Outlet Zone Trade Board — create a buying request or selling opportunity.
 * Any logged-in user can post their own. Insert via admin client after
 * verifying the session (so it works whether or not RLS insert is in place).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to post on the trade board.' }, { status: 401 })

  const b = await req.json().catch(() => ({})) as Record<string, string>
  const kind = b.kind === 'sell' ? 'sell' : 'buy'
  if (!b.title?.trim()) return NextResponse.json({ error: 'A title is required.' }, { status: 400 })

  const row = {
    owner_id: user.id,
    kind,
    title: b.title.trim().slice(0, 160),
    company_name: b.companyName?.trim() || null,
    category: b.category?.trim() || null,
    brand: b.brand?.trim() || null,
    condition: b.condition?.trim() || null,
    selling_unit: b.sellingUnit?.trim() || null,
    quantity: b.quantity?.trim() || null,
    budget: b.budget?.trim() || null,
    country_name: b.countryName?.trim() || null,
    description: b.description?.trim() || null,
    contact_email: b.contactEmail?.trim() || user.email || null,
    contact_whatsapp: b.contactWhatsapp?.trim() || null,
    status: 'open',
  }

  const { error } = await (createAdminClient().from('trade_requests') as any).insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
