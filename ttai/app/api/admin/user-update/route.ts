import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Admin updates another user's plan (tier) and/or role.
 * profiles RLS only allows self-updates, so client-side changes silently no-op —
 * this route verifies the caller is an admin and updates via the admin client.
 *
 * POST { userId, tier?, role? }
 */
const TIERS = ['free', 'standard', 'pro', 'full']
const ROLES = ['buyer', 'business_client', 'supplier', 'broker', 'admin']

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, tier, role } = await request.json().catch(() => ({})) as { userId?: string; tier?: string; role?: string }
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const patch: Record<string, any> = {}
  if (tier !== undefined) {
    if (!TIERS.includes(tier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    patch.tier = tier
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    patch.role = role
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await (admin.from('profiles') as any).update(patch).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
