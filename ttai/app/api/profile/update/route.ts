import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { regionKeysFor } from '@/lib/regions-map'

const ALLOWED_FIELDS = [
  'full_name', 'username', 'phone', 'bio',
  'company_name', 'business_type', 'category',
  'country_name', 'city', 'continent',
  'website_url', 'products_offered',
  'vat_number', 'tax_country',
]

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Only allow whitelisted fields
  const updates: Record<string, any> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      updates[key] = body[key] === '' ? null : body[key]
    }
  }

  // Username uniqueness check (if changing username)
  if (updates.username) {
    const slug = updates.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!slug) return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
    updates.username = slug

    const { data: existing } = await (createAdminClient() as any)
      .from('profiles')
      .select('id')
      .ilike('username', slug)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const admin = createAdminClient()
  let { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  // Resilience: if the tax columns aren't migrated yet, retry without them.
  if (error && /vat_number|tax_country|column/i.test(error.message)) {
    delete updates.vat_number; delete updates.tax_country
    ;({ data, error } = await admin.from('profiles').update(updates).eq('id', user.id).select().single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // ── Automatic placement ──
  // For suppliers, derive region keys from continent + country and sync them into
  // supplier_regions so their products surface automatically under that region/country.
  try {
    if (data?.role === 'supplier') {
      const { data: sup } = await admin.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
      if (sup?.id) {
        const keys = regionKeysFor(data.continent, data.country_name)
        if (keys.length > 0) {
          await (admin.from('supplier_regions') as any).upsert(
            keys.map((region_key) => ({ supplier_id: sup.id, region_key })),
            { onConflict: 'supplier_id,region_key' }
          )
        }
      }
    }
  } catch (e) {
    // Non-fatal — profile saved; region sync can be retried on next save
    console.warn('Auto region placement failed:', (e as Error).message)
  }

  return NextResponse.json({ profile: data })
}
