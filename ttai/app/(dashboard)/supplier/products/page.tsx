import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { formatCents } from '@/lib/utils'

export default async function SupplierProductsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price_cents, currency_code, is_published, stock_qty, categories(name), product_images(url, sort_order)')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products?.length ?? 0} total</p>
        </div>
        {supplier.status === 'ACTIVE' && (
          <Link href="/supplier/products/new" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            + Add Product
          </Link>
        )}
      </div>

      {!products?.length ? (
        <EmptyState
          title="No products yet"
          description={supplier.status === 'ACTIVE' ? 'Add your first product to start selling.' : 'Your account must be verified before adding products.'}
          action={supplier.status === 'ACTIVE' ? <Link href="/supplier/products/new" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Add Product</Link> : undefined}
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium">Stock</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => {
                const cat = p.categories as { name: string } | null
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cat?.name ?? '—'}</td>
                    <td className="px-4 py-3">{formatCents(p.price_cents, p.currency_code)}</td>
                    <td className="px-4 py-3">{p.stock_qty}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.is_published ? 'ACTIVE' : 'PENDING'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/supplier/products/${p.id}/edit`} className="text-xs text-primary hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
