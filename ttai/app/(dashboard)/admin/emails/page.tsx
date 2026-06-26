import Link from 'next/link'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUS_PILL: Record<string, string> = {
  sent: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}
const MAILBOX_PILL: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700',
  contact: 'bg-violet-50 text-violet-700',
  support: 'bg-amber-50 text-amber-700',
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string }
}) {
  await requireRole('admin')
  const admin = createAdminClient()
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const pageSize = 50
  const offset = (page - 1) * pageSize

  // Stats
  const since24 = new Date(Date.now() - 86400000).toISOString()
  const [totalRes, sentRes, failedRes, last24Res] = await Promise.all([
    admin.from('email_log').select('*', { count: 'exact', head: true }),
    admin.from('email_log').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    admin.from('email_log').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    admin.from('email_log').select('*', { count: 'exact', head: true }).gte('created_at', since24),
  ])
  const stats = [
    { label: 'Total sent', value: totalRes.count ?? 0, cls: 'text-[#0B1F4D]' },
    { label: 'Delivered', value: sentRes.count ?? 0, cls: 'text-green-600' },
    { label: 'Failed', value: failedRes.count ?? 0, cls: 'text-red-600' },
    { label: 'Last 24h', value: last24Res.count ?? 0, cls: 'text-[#0B1F4D]' },
  ]

  // Log rows
  let q = (admin.from('email_log') as any)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (searchParams.status && searchParams.status !== 'all') q = q.eq('status', searchParams.status)
  if (searchParams.q) q = q.or(`to_email.ilike.%${searchParams.q}%,subject.ilike.%${searchParams.q}%`)
  const { data: rows, count } = await q
  const tableMissing = !rows && (totalRes.count == null)

  const link = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { status: searchParams.status, q: searchParams.q, ...patch }
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v) })
    return `/admin/emails${sp.toString() ? `?${sp}` : ''}`
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Email Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Every transactional email sent by the platform — who, what, from which mailbox, and delivery status.</p>
      </div>

      {tableMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          The <code>email_log</code> table isn&apos;t set up yet. Apply migration <strong>0083_email_log.sql</strong> in Supabase, then emails will start appearing here.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${s.cls}`}>{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'sent', 'failed'].map((s) => (
              <Link key={s} href={link({ status: s === 'all' ? undefined : s, page: undefined })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${(searchParams.status ?? 'all') === s ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {s === 'all' ? 'All' : s === 'sent' ? 'Delivered' : 'Failed'}
              </Link>
            ))}
            <form action="/admin/emails" className="ml-auto">
              {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
              <input name="q" defaultValue={searchParams.q ?? ''} placeholder="Search recipient or subject…"
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm w-64 focus:border-[#0B1F4D] outline-none" />
            </form>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Recipient</th>
                  <th className="text-left px-4 py-3 font-semibold">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold">From</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(rows ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[180px]">{r.to_email}</td>
                    <td className="px-4 py-3 truncate max-w-[260px]" title={r.error || r.subject}>
                      <Link href={`/admin/emails/${r.id}`} className="text-[#0B1F4D] font-medium hover:underline">{r.subject ?? '—'}</Link>
                    </td>
                    <td className="px-4 py-3">
                      {r.mailbox && <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${MAILBOX_PILL[r.mailbox] ?? 'bg-gray-100 text-gray-600'}`}>{r.mailbox}@</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_PILL[r.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(rows ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No emails found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{(count ?? 0).toLocaleString()} emails · page {page} / {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && <Link href={link({ page: String(page - 1) })} className="rounded-lg border px-3 py-1.5 font-semibold hover:bg-gray-50">← Prev</Link>}
                {page < totalPages && <Link href={link({ page: String(page + 1) })} className="rounded-lg border px-3 py-1.5 font-semibold hover:bg-gray-50">Next →</Link>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
