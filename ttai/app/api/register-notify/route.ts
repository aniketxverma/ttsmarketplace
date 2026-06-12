import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { sendEmailFireAndForget } from '@/lib/email/send'

/**
 * Central registration inbox. Every registration (TTAI EMA, TTAIMA, supplier,
 * retail, distributor, broker…) sends a notification here so the admin manages
 * all incoming requests from one email address.
 *
 * Config (env):
 *   ADMIN_NOTIFY_EMAIL — where notifications land (the central inbox)
 *   RESEND_API_KEY + EMAIL_FROM — required for actual delivery (else dev-logs only)
 */
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'info@ttaiema.com'

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>
  const source = b.sourcePlatform || 'TTAI EMA'

  const rows: [string, string | undefined][] = [
    ['Full name', b.fullName],
    ['Company', b.companyName],
    ['Email', b.email],
    ['Phone / WhatsApp', b.phone],
    ['Country', b.countryName],
    ['City', b.city],
    ['Account type', b.accountType],
    ['Business type', b.businessType],
    ['Message / notes', b.message],
    ['Source platform', source],
  ]

  const body = React.createElement(
    'div',
    { style: { fontFamily: 'Arial, sans-serif', color: '#0B1F4D' } },
    React.createElement('h2', { style: { margin: '0 0 12px' } }, `New registration · ${source}`),
    React.createElement(
      'table',
      { cellPadding: 6, style: { borderCollapse: 'collapse', fontSize: '14px' } },
      React.createElement(
        'tbody',
        null,
        rows
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) =>
            React.createElement(
              'tr',
              { key: k },
              React.createElement('td', { style: { fontWeight: 'bold', color: '#475569', verticalAlign: 'top', paddingRight: '16px' } }, k),
              React.createElement('td', { style: { color: '#0f172a' } }, String(v)),
            ),
          ),
      ),
    ),
  )

  sendEmailFireAndForget({
    to: ADMIN_EMAIL,
    subject: `New ${b.accountType || 'registration'} — ${b.companyName || b.fullName || b.email || 'unknown'} · ${source}`,
    react: body as any,
  })

  return NextResponse.json({ ok: true })
}
