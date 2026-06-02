import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = [
  'full_name', 'username', 'phone', 'bio',
  'company_name', 'business_type', 'category',
  'country_name', 'city', 'continent',
  'website_url', 'products_offered',
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
  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ profile: data })
}
