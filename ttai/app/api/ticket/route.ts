import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/admin'
import { departmentInfo, defaultAssignee, type Department } from '@/lib/control-center'

/**
 * TTAIEMA Control Center — central ticket inbox.
 *
 * Every client request from ANY form (this site, the separate Marketplace
 * server, future WhatsApp / live-chat bridges) posts here. The ticket is routed
 * to the right department manager (Marketplace→Ane, Logistics→Eva,
 * Consulting→Zain) and the owner/admin sees everything in /admin/control-center.
 *
 * Config (env):
 *   ADMIN_NOTIFY_EMAIL — central inbox (defaults to info@ttaiema.com)
 *   RESEND_API_KEY + EMAIL_FROM — required for real delivery
 */
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'info@ttaiema.com'

// Allow other origins (the separate Marketplace site) to post tickets here.
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

const VALID_DEPTS: Department[] = ['marketplace', 'logistics', 'consulting']

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>

  const department = (VALID_DEPTS.includes(b.department as Department)
    ? b.department
    : 'marketplace') as Department
  const dept = departmentInfo(department)
  const assignedTo = b.assignedTo || defaultAssignee(department)
  const source = b.sourcePlatform || 'TTAI EMA'

  // Persist the ticket (table from migration 0068). The email still fires even
  // if the table isn't migrated yet.
  let ticketNo: number | null = null
  try {
    const { data } = await (createAdminClient().from('tickets') as any)
      .insert({
        client_name: b.clientName || b.fullName || null,
        company_name: b.companyName || null,
        email: b.email || null,
        phone: b.phone || null,
        country_name: b.countryName || null,
        department,
        assigned_to: assignedTo,
        status: 'new',
        subject: b.subject || null,
        message: b.message || null,
        attachment_url: b.attachmentUrl || null,
        source_platform: source,
        source_form: b.sourceForm || null,
      })
      .select('ticket_no')
      .single()
    ticketNo = data?.ticket_no ?? null
  } catch { /* table not migrated yet — email still sent */ }

  const rows: [string, string | undefined][] = [
    ['Department', `${dept.label} · ${assignedTo}`],
    ['Client', b.clientName || b.fullName],
    ['Company', b.companyName],
    ['Email', b.email],
    ['Phone / WhatsApp', b.phone],
    ['Country', b.countryName],
    ['Subject', b.subject],
    ['Message', b.message],
    ['Attachment', b.attachmentUrl],
    ['Source', `${source}${b.sourceForm ? ` · ${b.sourceForm}` : ''}`],
  ]

  const body = React.createElement(
    'div',
    { style: { fontFamily: 'Arial, sans-serif', color: '#0B1F4D' } },
    React.createElement('h2', { style: { margin: '0 0 4px' } },
      `New ticket${ticketNo ? ` #${ticketNo}` : ''} · ${dept.label}`),
    React.createElement('p', { style: { margin: '0 0 12px', color: '#475569', fontSize: '13px' } },
      `Assigned to ${assignedTo}`),
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
    subject: `[${dept.label}] ${b.subject || b.companyName || b.clientName || b.email || 'New request'} — for ${assignedTo}`,
    react: body as any,
  })

  return NextResponse.json({ ok: true, ticketNo, department, assignedTo }, { headers: CORS })
}
