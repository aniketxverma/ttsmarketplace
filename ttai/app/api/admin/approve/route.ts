import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { AccountStatusEmail } from '@/lib/email/templates/AccountStatusEmail'

const VALID = ['pending', 'approved', 'rejected'] as const

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the caller is an admin
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, status } = await request.json()
  if (!userId || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Use the admin client so the update always persists (bypasses profile RLS)
  const admin = createAdminClient()
  // Read the prior status so we only email on an actual approve/reject change.
  const { data: before } = await admin.from('profiles').select('approval_status, full_name, role').eq('id', userId).single()

  const { error } = await admin
    .from('profiles')
    .update({ approval_status: status })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the user when their account is approved or rejected (not on re-pending).
  if ((status === 'approved' || status === 'rejected') && before?.approval_status !== status) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      const authU = authUser?.user
      const email = authU?.email
      if (authU && email) {
        const fullName = (before as any)?.full_name
          || (authU.user_metadata as { full_name?: string })?.full_name
          || email.split('@')[0]
        sendEmailFireAndForget({
          to: email,
          role: 'contact',
          subject: status === 'approved' ? 'Your TTAI EMA account is approved 🎉' : 'Update on your TTAI EMA account',
          react: React.createElement(AccountStatusEmail, {
            fullName,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
            status,
            role: (before as any)?.role ?? null,
          }),
          idempotencyKey: `account-${status}-${userId}`,
        })
      }
    } catch { /* email is best-effort; approval already persisted */ }
  }

  return NextResponse.json({ ok: true, status })
}
