import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { ResetPasswordEmail } from '@/lib/email/templates/ResetPasswordEmail'

/**
 * Send a password-reset link through OUR mailer (Resend / SMTP) instead of
 * Supabase's built-in email (which often isn't delivered). We generate the same
 * recovery link via the admin API and email it ourselves. Always returns ok so
 * we never reveal whether an account exists.
 */
export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string }
  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  const redirectTo = `${appUrl}/api/auth/callback?next=${encodeURIComponent('/reset-password?mode=confirm')}`

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })
    const link = (data as any)?.properties?.action_link as string | undefined
    if (!error && link) {
      sendEmailFireAndForget({
        to: email,
        role: 'support',
        subject: 'Reset your TTAI EMA password',
        react: React.createElement(ResetPasswordEmail, { link }),
      })
    }
    // If the user doesn't exist, generateLink errors — swallow it (no enumeration).
  } catch { /* swallow — always report success */ }

  return NextResponse.json({ ok: true })
}
