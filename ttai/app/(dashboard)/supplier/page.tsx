import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBanner } from '@/components/supplier/StatusBanner'
import { requireAuth } from '@/lib/auth/rbac'
import type { SupplierStatus } from '@/types/domain'

export default async function SupplierDashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status, legal_name')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) {
    redirect('/supplier/onboarding')
  }

  const [productsCount, ordersCount, docsCount] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
    supabase.from('supplier_documents').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <StatusBanner status={supplier.status as SupplierStatus} />

      <div>
        <h1 className="text-2xl font-bold">{supplier.legal_name}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Supplier Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Products',  value: productsCount.count ?? 0, href: '/supplier/products' },
          { label: 'Orders',    value: ordersCount.count ?? 0,   href: '/supplier/orders' },
          { label: 'Documents', value: docsCount.count ?? 0,     href: '/supplier/documents' },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {supplier.status === 'ACTIVE' && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <Link
              href="/supplier/products/new"
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Add Product
            </Link>
            <Link
              href="/supplier/orders"
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              View Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
