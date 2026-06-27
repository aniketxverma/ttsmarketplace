import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/rbac'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** Preview the exact email that was sent (rendered HTML body in a sandboxed iframe). */
export default async function EmailPreviewPage({ params }: { params: { id: string } }) {
  await requireRole('admin')

  const tt = await localizeUI(["Preview of the email as it was delivered.", "Delivery error:", "Email content"], getLocale())
  const admin = createAdminClient()
  const { data: row } = await (admin.from('email_log') as any).select('*').eq('id', params.id).maybeSingle()
  if (!row) notFound()

  const meta: [string, string][] = [
    ['To', row.to_email],
    ['Subject', row.subject ?? '—'],
    ['Mailbox', row.mailbox ? `${row.mailbox}@` : '—'],
    ['Provider', row.provider ?? '—'],
    ['Status', row.status ?? '—'],
    ['Sent', row.created_at ? new Date(row.created_at).toLocaleString() : '—'],
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/admin/emails" className="text-sm font-semibold text-gray-500 hover:text-[#0B1F4D]">← Back to Email Center</Link>
      <div>
        <h1 className="text-2xl font-bold">{row.subject ?? 'Email'}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{tt("Preview of the email as it was delivered.")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {meta.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{k}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{v}</p>
          </div>
        ))}
      </div>

      {row.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>{tt("Delivery error:")}</strong> {row.error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">{tt("Email content")}</div>
        {row.html ? (
          <iframe title="Email preview" sandbox="" srcDoc={row.html} className="w-full" style={{ height: 720, border: 0 }} />
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">
            Content wasn&apos;t stored for this email.<br />
            Apply migration <strong>0085_email_log_html.sql</strong> — new emails will show their full preview here.
          </div>
        )}
      </div>
    </div>
  )
}
