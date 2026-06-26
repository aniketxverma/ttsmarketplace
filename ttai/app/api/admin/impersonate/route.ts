import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signImpersonation, IMP_COOKIE, IMP_LABEL_COOKIE } from '@/lib/impersonation'

const ROLE_DASH: Record<string, string> = {
  buyer: '/buyer', business_client: '/buyer', supplier: '/supplier', broker: '/broker', admin: '/admin',
}

/**
 * Admin "Login as user" — generates a one-time magic-link token for the target
 * user and returns a /auth/callback URL the admin's browser navigates to, which
 * establishes a session AS that user. Admin-only; cannot impersonate admins.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if ((me as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json().catch(() => ({})) as { userId?: string }
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: target } = await admin.auth.admin.getUserById(userId)
  const email = target?.user?.email
  if (!email) return NextResponse.json({ error: 'User has no email' }, { status: 404 })

  const { data: prof } = await admin.from('profiles').select('role').eq('id', userId).single()
  const role = (prof as any)?.role ?? 'buyer'
  if (role === 'admin') return NextResponse.json({ error: 'Cannot impersonate another admin' }, { status: 400 })

  // Generate a magic-link token (does NOT send an email).
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !link?.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message || 'Could not create login link' }, { status: 500 })
  }

  const next = ROLE_DASH[role] ?? '/buyer'
  const url = `/auth/callback?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink&next=${encodeURIComponent(next)}`

  // Remember the original admin (signed) + a readable label for the banner.
  const res = NextResponse.json({ url })
  const opts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 8 * 60 * 60 }
  res.cookies.set(IMP_COOKIE, signImpersonation(user.id), opts)
  res.cookies.set(IMP_LABEL_COOKIE, encodeURIComponent(email), { ...opts, httpOnly: false })
  return res
}
