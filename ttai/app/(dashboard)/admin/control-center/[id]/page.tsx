import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'
import { departmentInfo, statusInfo } from '@/lib/control-center'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { TicketControls, NoteForm } from '../TicketControls'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  await requireRole('admin')

  const tt = await localizeUI(["Client details", "Reply by email", "WhatsApp", "View attachment", "Message", "Internal notes", "Visible to the admin & managers only.", "No notes yet."], getLocale())
  const adminDb = createAdminClient()

  const { data: t } = await (adminDb.from('tickets') as any)
    .select('*').eq('id', params.id).single()
  if (!t) notFound()

  const { data: notes } = await (adminDb.from('ticket_notes') as any)
    .select('id, author, note, created_at').eq('ticket_id', params.id).order('created_at', { ascending: true })

  const dep = departmentInfo(t.department)
  const st = statusInfo(t.status)

  const facts: [string, string | null][] = [
    ['Client', t.client_name],
    ['Company', t.company_name],
    ['Email', t.email],
    ['Phone / WhatsApp', t.phone],
    ['Country', t.country_name],
    ['Department', dep.label],
    ['Source', [t.source_platform, t.source_form].filter(Boolean).join(' · ')],
    ['Created', new Date(t.created_at).toLocaleString('en-GB')],
  ]

  const wa = t.phone ? `https://wa.me/${String(t.phone).replace(/\D/g, '')}` : null

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/control-center" className="text-sm text-muted-foreground hover:underline">← All tickets</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-400">#{t.ticket_no ?? '—'}</span>
            <span className={`inline-flex items-center rounded-full text-[11px] font-bold px-2 py-0.5 ${st.color}`}>{st.label}</span>
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold px-2 py-0.5">{dep.label}</span>
          </div>
          <h1 className="text-xl font-bold mt-1">{t.subject || 'Client request'}</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border bg-card p-4">
        <TicketControls id={t.id} status={t.status} assignedTo={t.assigned_to} />
      </div>

      {/* Client facts */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3 text-sm">{tt("Client details")}</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {facts.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="text-gray-400 font-medium w-32 flex-shrink-0">{k}</dt>
              <dd className="text-gray-800">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 mt-4">
          {t.email && <a href={`mailto:${t.email}`} className="rounded-lg bg-[#0B1F4D] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#162d6e]">{tt("Reply by email")}</a>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-green-200 text-green-600 px-3.5 py-1.5 text-xs font-bold hover:bg-green-50">{tt("WhatsApp")}</a>}
          {t.attachment_url && <a href={t.attachment_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 text-gray-600 px-3.5 py-1.5 text-xs font-bold hover:bg-gray-50">{tt("View attachment")}</a>}
        </div>
      </div>

      {/* Message */}
      {t.message && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-2 text-sm">{tt("Message")}</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{t.message}</p>
        </div>
      )}

      {/* Internal notes */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-1 text-sm">{tt("Internal notes")}</h2>
        <p className="text-xs text-gray-400 mb-3">{tt("Visible to the admin & managers only.")}</p>
        <div className="space-y-2">
          {(notes ?? []).map((n: any) => (
            <div key={n.id} className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.note}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {n.author || 'Admin'} · {new Date(n.created_at).toLocaleString('en-GB')}
              </p>
            </div>
          ))}
          {!notes?.length && <p className="text-sm text-gray-400">{tt("No notes yet.")}</p>}
        </div>
        <NoteForm ticketId={t.id} />
      </div>
    </div>
  )
}
