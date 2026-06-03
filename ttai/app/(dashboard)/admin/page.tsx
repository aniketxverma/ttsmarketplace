import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'
import { ApprovalChanger } from './users/ApprovalChanger'

const ROLE_COLORS: Record<string, string> = {
  admin:           'bg-red-100 text-red-700',
  supplier:        'bg-orange-100 text-orange-700',
  broker:          'bg-purple-100 text-purple-700',
  business_client: 'bg-blue-100 text-blue-700',
  buyer:           'bg-green-100 text-green-700',
}

export default async function AdminDashboardPage() {
  await requireRole('admin')
  const supabase = createClient()
  const adminDb = createAdminClient()

  const [
    pendingCount, activeCount, transactionsRes, disputesCount,
    usersCount, productsCount, ordersCount, categoriesCount,
    aiChatsCount, recentAudit, pendingApps, pendingAppsTotal,
  ] = await Promise.all([
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).in('status', ['PENDING', 'UNDER_REVIEW']),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('transaction_ledger').select('gross_cents').gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    (adminDb.from('ai_chats' as any) as any).select('id', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('admin_audit_log').select('id, action, target_type, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
    // Pending applications awaiting review (newest first)
    adminDb.from('profiles')
      .select('id, full_name, username, role, company_name, business_type, category, country_name, city, phone, website_url, bio, products_offered, avatar_url, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),
    adminDb.from('profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
  ])

  const apps = pendingApps.data ?? []
  const appsTotal = (pendingAppsTotal as any).count ?? apps.length
  const txTotal = transactionsRes.data?.reduce((sum, t) => sum + t.gross_cents, 0) ?? 0

  const kpis = [
    { label: 'Applications to Review', value: appsTotal,            href: '/admin/users?status=pending',    color: 'text-amber-600' },
    { label: 'Active Suppliers',     value: activeCount.count ?? 0,   href: '/admin/suppliers?status=ACTIVE', color: 'text-green-600' },
    { label: 'Registered Users',     value: usersCount.count ?? 0,    href: '/admin/users',                   color: 'text-blue-600' },
    { label: 'Published Products',   value: productsCount.count ?? 0, href: '/admin/products?filter=published', color: 'text-indigo-600' },
    { label: 'Total Orders',         value: ordersCount.count ?? 0,   href: '/admin/orders',                  color: 'text-purple-600' },
    { label: 'Categories',           value: categoriesCount.count ?? 0, href: '/admin/categories',            color: 'text-teal-600' },
    { label: 'Transactions (30d)',   value: `${transactionsRes.data?.length ?? 0} / ${formatCents(txTotal, 'EUR')}`, href: '/admin/transactions', color: 'text-emerald-600' },
    { label: 'Open Disputes',        value: disputesCount.count ?? 0,  href: '/admin/disputes',   color: 'text-red-600' },
    { label: 'AI Chat Messages',     value: (aiChatsCount as any).count ?? 0, href: '/admin/ai-chats', color: 'text-pink-600' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform overview</p>
      </div>

      {/* ── Applications awaiting review ─────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-amber-900 text-base leading-tight">Applications Awaiting Review</h2>
              <p className="text-xs text-amber-700">Verify each applicant&apos;s details, then approve or reject</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {appsTotal > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500 text-white text-sm font-extrabold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {appsTotal}
              </span>
            )}
            <Link href="/admin/users?status=pending"
              className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline whitespace-nowrap">
              Review all →
            </Link>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-amber-700/80 font-medium">All caught up — no pending applications 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100/70">
            {apps.map((u: any) => {
              const location = [u.city, u.country_name].filter(Boolean).join(', ')
              return (
                <div key={u.id} className="px-5 sm:px-6 py-4 flex flex-wrap items-start gap-4 hover:bg-white/40 transition-colors">
                  {/* Avatar */}
                  {u.avatar_url ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-amber-100 shadow-sm">
                      <Image src={u.avatar_url} alt={u.full_name ?? 'User'} width={44} height={44} className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B1F4D] to-[#1a3580] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-extrabold">{(u.full_name ?? '?')[0].toUpperCase()}</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-gray-900">{u.full_name ?? '—'}</p>
                      {u.username && <span className="text-gray-400 text-xs font-mono">@{u.username}</span>}
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                      {u.business_type && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">{u.business_type}</span>}
                      {u.category && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">{u.category}</span>}
                    </div>
                    {u.company_name && <p className="text-sm text-gray-600 font-semibold mt-0.5">{u.company_name}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-1">
                      {location && <span>📍 {location}</span>}
                      {u.phone && <span>📞 {u.phone}</span>}
                      {u.website_url && <span className="text-[#0B1F4D]">🌐 {u.website_url.replace(/^https?:\/\//, '')}</span>}
                      <span>Applied {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {u.bio && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed max-w-2xl">{u.bio}</p>}
                  </div>

                  {/* Approve / Reject */}
                  <div className="flex-shrink-0">
                    <ApprovalChanger userId={u.id} currentStatus="pending" />
                  </div>
                </div>
              )
            })}
            {appsTotal > apps.length && (
              <Link href="/admin/users?status=pending"
                className="block px-6 py-3 text-center text-sm font-bold text-amber-800 hover:bg-white/40 transition-colors">
                + {appsTotal - apps.length} more application{appsTotal - apps.length !== 1 ? 's' : ''} — review all →
              </Link>
            )}
          </div>
        )}
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
