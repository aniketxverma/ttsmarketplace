import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBanner } from '@/components/supplier/StatusBanner'
import { requireAuth } from '@/lib/auth/rbac'
import type { SupplierStatus } from '@/types/domain'

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTIVE:       'bg-green-100 text-green-800 border-green-200',
  SUSPENDED:    'bg-red-100 text-red-800 border-red-200',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  paid:      'bg-blue-100 text-blue-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default async function SupplierDashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status, legal_name, trade_name, reliability_tier, created_at')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  const [
    productsRes,
    ordersRes,
    docsRes,
    recentOrdersRes,
    recentProductsRes,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
    supabase.from('orders').select('id, total_cents, status', { count: 'exact' }).eq('supplier_id', supplier.id),
    supabase.from('supplier_documents').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
    supabase.from('orders')
      .select('id, status, total_cents, currency_code, created_at, profiles(full_name)')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('products')
      .select('id, name, price_cents, currency_code, is_published, stock_qty')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const allOrders = ordersRes.data ?? []
  const totalRevenue = allOrders
    .filter(o => o.status === 'paid' || o.status === 'fulfilled')
    .reduce((sum, o) => sum + (o.total_cents ?? 0), 0)
  const pendingOrders = allOrders.filter(o => o.status === 'paid').length

  const recentOrders = recentOrdersRes.data ?? []
  const recentProducts = recentProductsRes.data ?? []

  const displayName = supplier.trade_name ?? supplier.legal_name
  const joinedYear = new Date(supplier.created_at).getFullYear()
  const statusColor = STATUS_COLORS[supplier.status] ?? STATUS_COLORS.PENDING

  return (
    <div className="space-y-6 max-w-6xl">
      <StatusBanner status={supplier.status as SupplierStatus} />

      {/* Header card */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-r from-[#0B1F4D] to-[#162d6e] text-white p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm">Supplier Dashboard</p>
            <h1 className="text-2xl font-extrabold mt-1">{displayName}</h1>
            <p className="text-blue-300 text-sm mt-1">{supplier.legal_name} · Member since {joinedYear}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor}`}>
              {supplier.status}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30">
              {supplier.reliability_tier}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: fmt(totalRevenue),
            sub: 'paid + fulfilled orders',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'text-green-600 bg-green-50',
            href: '/supplier/orders',
          },
          {
            label: 'Total Orders',
            value: ordersRes.count ?? 0,
            sub: `${pendingOrders} awaiting fulfillment`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            color: 'text-blue-600 bg-blue-50',
            href: '/supplier/orders',
          },
          {
            label: 'Products Listed',
            value: productsRes.count ?? 0,
            sub: 'across all categories',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
            color: 'text-purple-600 bg-purple-50',
            href: '/supplier/products',
          },
          {
            label: 'Documents',
            value: docsRes.count ?? 0,
            sub: 'uploaded for verification',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            color: 'text-orange-600 bg-orange-50',
            href: '/supplier/documents',
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-extrabold text-[#0B1F4D] group-hover:text-[#162d6e]">{stat.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-bold text-[#0B1F4D]">Recent Orders</h2>
            <Link href="/supplier/orders" className="text-xs text-[#0B1F4D] hover:underline font-semibold">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No orders yet</p>
              <p className="text-xs text-gray-400 mt-1">Orders appear here when buyers purchase your products</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => {
                const buyer = order.profiles as any as { full_name: string | null } | null
                const statusCls = ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
                return (
                  <Link
                    key={order.id}
                    href={`/supplier/orders/${order.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {buyer?.full_name ?? 'Unknown buyer'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          <span className="font-mono">{order.id.slice(0, 8)}…</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
                        {order.status}
                      </span>
                      <p className="text-sm font-bold text-[#0B1F4D]">
                        {fmt(order.total_cents, order.currency_code)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick actions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="font-bold text-[#0B1F4D] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {supplier.status === 'ACTIVE' ? (
                <>
                  <Link
                    href="/supplier/products/new"
                    className="flex items-center gap-3 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-4 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors w-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Product
                  </Link>
                  <Link
                    href="/supplier/orders"
                    className="flex items-center gap-3 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-4 py-3 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all w-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Manage Orders
                  </Link>
                </>
              ) : (
                <Link
                  href="/supplier/documents"
                  className="flex items-center gap-3 rounded-xl bg-[#0B1F4D] text-white px-4 py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Documents
                </Link>
              )}
              <Link
                href="/supplier/messages"
                className="flex items-center gap-3 rounded-xl bg-gray-50 text-gray-700 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </Link>
              <Link
                href="/supplier/documents"
                className="flex items-center gap-3 rounded-xl bg-gray-50 text-gray-700 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents & Verification
              </Link>
              <Link
                href="/supplier/settings"
                className="flex items-center gap-3 rounded-xl bg-gray-50 text-gray-700 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Account Settings
              </Link>
            </div>
          </div>

          {/* Recent products */}
          {recentProducts.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#0B1F4D]">Your Products</h2>
                <Link href="/supplier/products" className="text-xs text-[#0B1F4D] hover:underline font-semibold">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {recentProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/supplier/products/${p.id}/edit`}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Intl.NumberFormat('en-EU', { style: 'currency', currency: p.currency_code }).format(p.price_cents / 100)}
                        {' · Stock: '}{p.stock_qty}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_published ? 'Live' : 'Draft'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
