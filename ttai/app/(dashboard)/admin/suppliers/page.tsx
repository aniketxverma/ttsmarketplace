import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

const STATUSES = ['ALL', 'PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED']

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  await requireRole('admin')
  const supabase = createClient()

  const status = searchParams.status

  let query = supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, status, created_at, country_id, countries(iso_code), owner_id')
    .order('created_at', { ascending: true })

  if (status && status !== 'ALL') {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['PENDING', 'UNDER_REVIEW'])
  }

  const { data: suppliers } = await query

  const counts: Record<string, number> = {}
  for (const s of ['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED']) {
    const { count } = await supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', s)
    counts[s] = count ?? 0
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold">Suppliers</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const isActive = (s === 'ALL' && !status) || status === s
          const count = s === 'ALL' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s] ?? 0)
          return (
            <Link
              key={s}
              href={s === 'ALL' ? '/admin/suppliers' : `/admin/suppliers?status=${s}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                isActive ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
              }`}
            >
              {s} <span className="ml-1 opacity-70">{count}</span>
            </Link>
          )
        })}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Supplier</th>
              <th className="text-left px-4 py-3 font-medium">Country</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {suppliers?.map((s) => {
              const country = s.countries as { iso_code: string } | null
              return (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.legal_name}</p>
                    {s.trade_name && <p className="text-xs text-muted-foreground">{s.trade_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{country?.iso_code ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/suppliers/${s.id}`} className="text-xs text-primary hover:underline">Review</Link>
                  </td>
                </tr>
              )
            })}
            {!suppliers?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No suppliers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
