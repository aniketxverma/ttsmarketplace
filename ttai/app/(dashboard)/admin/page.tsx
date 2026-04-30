import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'

export default async function AdminDashboardPage() {
  await requireRole('admin')
  const supabase = createClient()

  const [
    pendingCount, activeCount, transactionsRes, disputesCount,
    usersCount, productsCount, ordersCount, categoriesCount,
    recentAudit,
  ] = await Promise.all([
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).in('status', ['PENDING', 'UNDER_REVIEW']),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('transaction_ledger').select('gross_cents').gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('admin_audit_log').select('id, action, target_type, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
  ])

  const txTotal = transactionsRes.data?.reduce((sum, t) => sum + t.gross_cents, 0) ?? 0

  const kpis = [
    { label: 'Pending Verification', value: pendingCount.count ?? 0,  href: '/admin/suppliers',               color: 'text-yellow-600' },
    { label: 'Active Suppliers',     value: activeCount.count ?? 0,   href: '/admin/suppliers?status=ACTIVE', color: 'text-green-600' },
    { label: 'Registered Users',     value: usersCount.count ?? 0,    href: '/admin/users',                   color: 'text-blue-600' },
    { label: 'Published Products',   value: productsCount.count ?? 0, href: '/admin/products?filter=published', color: 'text-indigo-600' },
    { label: 'Total Orders',         value: ordersCount.count ?? 0,   href: '/admin/orders',                  color: 'text-purple-600' },
    { label: 'Categories',           value: categoriesCount.count ?? 0, href: '/admin/categories',            color: 'text-teal-600' },
    { label: 'Transactions (30d)',   value: `${transactionsRes.data?.length ?? 0} / ${formatCents(txTotal, 'EUR')}`, href: '/admin/transactions', color: 'text-emerald-600' },
    { label: 'Open Disputes',        value: disputesCount.count ?? 0, href: '/admin/disputes',                color: 'text-red-600' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <a key={kpi.label} href={kpi.href} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
          </a>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentAudit.data?.map((entry) => {
            const actor = entry.profiles as any as { full_name: string | null } | null
            return (
              <div key={entry.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{entry.action}</span>
                  <span className="text-muted-foreground">{entry.target_type}</span>
                  {actor?.full_name && <span className="text-xs text-muted-foreground">by {actor.full_name}</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            )
          })}
          {!recentAudit.data?.length && <p className="text-sm text-muted-foreground">No recent activity</p>}
        </div>
      </div>
    </div>
  )
}
