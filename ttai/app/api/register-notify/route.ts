import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { NotificationEmail } from '@/lib/email/templates/NotificationEmail'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Central registration inbox. Every registration (TTAI EMA, TTAIMA, supplier,
 * retail, distributor, broker…) sends a notification here so the admin manages
 * all incoming requests from one email address.
 *
 * Config (env):
 *   ADMIN_NOTIFY_EMAIL — where notifications land (the central inbox)
 *   RESEND_API_KEY + EMAIL_FROM — required for actual delivery (else dev-logs only)
 */
// Central inbox for client registrations. EMAIL_FROM is the sender, never the
// recipient — so notifications always reach info@ttaiema.com unless overridden.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'info@ttaiema.com'

// Allow the separate TTAIMA website (different origin) to post registrations here.
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

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

  sendEmailFireAndForget({
    to: ADMIN_EMAIL,
    subject: `New ${b.accountType || 'registration'} — ${b.companyName || b.fullName || b.email || 'unknown'} · ${source}`,
    react: React.createElement(NotificationEmail, {
      title: `New registration · ${source}`,
      intro: 'A new account just registered on the platform.',
      rows,
    }),
  })

  // Persist so the admin dashboard has the full list (table from migration 0058).
  try {
    await (createAdminClient().from('registration_requests') as any).insert({
      full_name: b.fullName || null, company_name: b.companyName || null, email: b.email || null,
      phone: b.phone || null, country_name: b.countryName || null, city: b.city || null,
      account_type: b.accountType || null, business_type: b.businessType || null,
      message: b.message || null, source_platform: source,
    })
  } catch { /* table not migrated yet — email still sent */ }

  return NextResponse.json({ ok: true }, { headers: CORS })
}
