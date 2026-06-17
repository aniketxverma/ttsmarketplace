import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_AUDIENCE, type ChainRole } from '@/lib/opportunities'

/**
 * Publish a business opportunity (a factory/supplier "looking for…" requirement
 * or a promotion). Audience defaults to the chain rule for the poster's role
 * unless the poster picks a custom audience.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to post an opportunity.' }, { status: 401 })

  const b = await req.json().catch(() => ({})) as Record<string, any>
  if (!b.title?.trim()) return NextResponse.json({ error: 'A title is required.' }, { status: 400 })

  const posterRole = ['factory', 'supplier', 'distributor', 'retail'].includes(b.posterRole) ? b.posterRole : 'supplier'
  const audience: ChainRole[] = Array.isArray(b.audience) && b.audience.length
    ? b.audience.filter((a: string) => ['supplier', 'distributor', 'retail', 'client'].includes(a))
    : (DEFAULT_AUDIENCE[posterRole] ?? [])

  const row = {
    owner_id: user.id,
    company_name: b.companyName?.trim() || null,
    poster_role: posterRole,
    kind: b.kind === 'promotion' ? 'promotion' : 'looking',
    looking_for: b.lookingFor?.trim() || null,
    audience,
    title: b.title.trim().slice(0, 160),
    description: b.description?.trim() || null,
    product: b.product?.trim() || null,
    category: b.category?.trim() || null,
    country_target: b.countryTarget?.trim() || null,
    image_url: b.imageUrl?.trim() || null,
    contact_email: b.contactEmail?.trim() || user.email || null,
    contact_whatsapp: b.contactWhatsapp?.trim() || null,
    status: 'open',
  }

  const { error } = await (createAdminClient().from('business_opportunities') as any).insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
