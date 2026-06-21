import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { sendEmail } from '@/lib/email/send'
import { BaseEmail } from '@/lib/email/templates/Base'
import { isSmtpConfigured, smtpCredsForRole, type MailRole } from '@/lib/email/client'

export const dynamic = 'force-dynamic'

// GET /api/email/test?to=you@example.com&role=info
// Guarded by CRON_SECRET (Authorization: Bearer <CRON_SECRET>  or  ?secret=<CRON_SECRET>)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const secret = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || url.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const to = url.searchParams.get('to')
  if (!to) return NextResponse.json({ error: 'missing ?to=' }, { status: 400 })

  const role = (url.searchParams.get('role') as MailRole) || 'info'
  const creds = smtpCredsForRole(role)

  try {
    const result = await sendEmail({
      to,
      role,
      subject: `TTAI SMTP test — ${role}`,
      react: React.createElement(
        BaseEmail,
        { preview: 'SMTP test' } as any,
        React.createElement('h2', null, 'SMTP is working ✅'),
        React.createElement('p', null, `This test was sent from the "${role}" mailbox (${creds?.user ?? 'not configured'}).`),
        React.createElement('p', null, `Provider: ${isSmtpConfigured() ? 'Hostinger SMTP' : process.env.RESEND_API_KEY ? 'Resend (fallback)' : 'dev log'}.`),
      ),
    })
    return NextResponse.json({ ok: true, role, from: creds?.user ?? null, smtp: isSmtpConfigured(), result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, role, error: err?.message ?? String(err) }, { status: 500 })
  }
}
