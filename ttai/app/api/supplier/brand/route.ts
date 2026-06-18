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
  // Industrial Park zone (0066)
  'industrial_park',
  // Free sales channel (B2B vs retail)
  'marketplace_context', 'shop_type_chosen',
  // Premium Shop Design
  'brand_color', 'card_template',
  // Outlet Zone participant type (0069)
  'outlet_role',
  // Outlet Zone sell mode (0075)
  'outlet_sell_mode',
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
    .from('suppliers').select('id, country_id').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile found' }, { status: 404 })

  // Auto-create missing province / city so the location map fills itself as
  // suppliers register their real location (Country → Province → City).
  const countryId = (sup as any).country_id ?? body.country_id ?? null
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  const findOrCreate = async (table: string, parent: Record<string, any>, name: string): Promise<string | null> => {
    const nm = name.trim(); if (!nm) return null
    const slug = slugify(nm)
    let q = admin.from(table).select('id') as any
    for (const [k, v] of Object.entries(parent)) q = q.eq(k, v)
    const { data: ex } = await q.ilike('name', nm).maybeSingle()
    if (ex) return (ex as any).id
    const { data, error: insErr } = await (admin.from(table) as any).insert({ ...parent, name: nm, slug }).select('id').single()
    if (insErr) {
      let q2 = admin.from(table).select('id') as any
      for (const [k, v] of Object.entries(parent)) q2 = q2.eq(k, v)
      const { data: ex2 } = await q2.eq('slug', slug).maybeSingle()
      return ex2 ? (ex2 as any).id : null
    }
    return (data as any).id
  }
  if (typeof body.new_province === 'string' && body.new_province.trim() && countryId) {
    payload.province_id = await findOrCreate('provinces', { country_id: countryId }, body.new_province)
  }
  const provId = payload.province_id ?? body.province_id ?? null
  if (typeof body.new_city === 'string' && body.new_city.trim() && countryId) {
    payload.city_id = await findOrCreate('cities', { country_id: countryId, province_id: provId }, body.new_city)
  }

  let { error } = await (admin.from('suppliers') as any).update(payload).eq('id', (sup as any).id)
  // Resilience: if a recently-added column isn't migrated yet, drop it and retry.
  if (error && /min_order_value_cents|card_template|industrial_park|outlet_role|outlet_sell_mode|column|does not exist/i.test(error.message)) {
    delete payload.min_order_value_cents
    delete payload.card_template
    delete payload.industrial_park
    delete payload.outlet_role
    delete payload.outlet_sell_mode
    if (Object.keys(payload).length) {
      ;({ error } = await (admin.from('suppliers') as any).update(payload).eq('id', (sup as any).id))
    } else error = null
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, province_id: payload.province_id ?? null, city_id: payload.city_id ?? null })
}
