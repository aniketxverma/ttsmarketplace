import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyImpersonation, IMP_COOKIE, IMP_LABEL_COOKIE } from '@/lib/impersonation'

/**
 * Return to admin — restores the original admin's session after impersonating.
 * Authority comes from the signed IMP_COOKIE set when impersonation began (the
 * current session is the impersonated user, so it can't be admin-checked).
 */
export async function POST(req: NextRequest) {
  const adminId = verifyImpersonation(req.cookies.get(IMP_COOKIE)?.value)
  if (!adminId) return NextResponse.json({ error: 'No impersonation session' }, { status: 403 })

  const admin = createAdminClient()
  // Double-check the stored id really is an admin before restoring.
  const { data: prof } = await admin.from('profiles').select('role').eq('id', adminId).single()
  if ((prof as any)?.role !== 'admin') return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const { data: a } = await admin.auth.admin.getUserById(adminId)
  const email = a?.user?.email
  if (!email) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !link?.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message || 'Could not restore session' }, { status: 500 })
  }

  const url = `/auth/callback?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink&next=${encodeURIComponent('/admin/users')}`
  const res = NextResponse.json({ url })
  res.cookies.set(IMP_COOKIE, '', { path: '/', maxAge: 0 })
  res.cookies.set(IMP_LABEL_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
