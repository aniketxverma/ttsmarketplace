import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Save the authenticated supplier's brand profile.
 *
 * RLS only lets an owner update their suppliers row while PENDING/UNDER_REVIEW,
 * so an ACTIVE supplier's client-side edits silently no-op. This endpoint updates
 * via the admin client after verifying ownership, and only whitelisted brand
 * fields (never status / tier / owner_id).
 */
const ALLOWED = new Set([
  'brand_slug', 'tagline', 'logo_url', 'banner_image', 'description', 'about_company',
  'founded_year', 'employee_count', 'years_experience', 'countries_served',
  'website', 'phone', 'whatsapp', 'business_email', 'working_hours', 'google_map_link',
  'instagram', 'facebook', 'linkedin', 'twitter', 'youtube',
  'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'section_visibility',
  'min_order_value_cents',
  // Retail local commerce location (Phase 5)
  'province_id', 'city_id', 'town_id', 'neighborhood_id', 'delivery_radius_km',
  // Free sales channel (B2B vs retail)
  'marketplace_context', 'shop_type_chosen',
  // Premium Shop Design
  'brand_color',
])

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, any>
  const payload: Record<string, any> = {}
  for (const k of Object.keys(body)) if (ALLOWED.has(k)) payload[k] = body[k]
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: sup } = await admin
    .from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile found' }, { status: 404 })

  let { error } = await (admin.from('suppliers') as any).update(payload).eq('id', (sup as any).id)
  // Resilience: if a recently-added column isn't migrated yet, drop it and retry.
  if (error && /min_order_value_cents|column|does not exist/i.test(error.message)) {
    delete payload.min_order_value_cents
    if (Object.keys(payload).length) {
      ;({ error } = await (admin.from('suppliers') as any).update(payload).eq('id', (sup as any).id))
    } else error = null
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
