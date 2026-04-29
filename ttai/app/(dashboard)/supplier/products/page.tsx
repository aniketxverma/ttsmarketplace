import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ProductActions } from '@/components/supplier/ProductActions'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

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
    .select('id, name, price_cents, currency_code, is_published, stock_qty, min_order_qty, sku, categories(name), product_images(url, sort_order)')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products?.length ?? 0} product{products?.length !== 1 ? 's' : ''} total</p>
        </div>
        {supplier.status === 'ACTIVE' ? (
          <Link
            href="/supplier/products/new"
            className="flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#fbb93a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        ) : (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-2 text-xs text-yellow-800 font-medium">
            Account verification required to add products
          </div>
        )}
      </div>

      {!products?.length ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">No products yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            {supplier.status === 'ACTIVE'
              ? 'Add your first product to start selling on the marketplace.'
              : 'Your account must be verified before you can add products.'}
          </p>
          {supplier.status === 'ACTIVE' && (
            <Link
              href="/supplier/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors"
            >
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const cat = p.categories as any as { name: string } | null
                const images = (p.product_images as { url: string; sort_order: number }[])
                  .sort((a, b) => a.sort_order - b.sort_order)
                const thumb = images[0]?.url

                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          {thumb ? (
                            <Image src={thumb} alt={p.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-base">📦</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[200px]">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500 hidden sm:table-cell">{cat?.name ?? '—'}</td>
                    <td className="px-4 py-4 font-semibold text-[#0B1F4D]">{fmt(p.price_cents, p.currency_code)}</td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`text-sm font-medium ${p.stock_qty === 0 ? 'text-red-500' : p.stock_qty < 10 ? 'text-orange-500' : 'text-gray-700'}`}>
                        {p.stock_qty} units
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_published ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {p.is_published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/supplier/products/${p.id}/edit`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0B1F4D]/5 text-[#0B1F4D] hover:bg-[#0B1F4D]/10 transition-colors"
                        >
                          Edit
                        </Link>
                        <ProductActions productId={p.id} isPublished={p.is_published ?? false} />
                      </div>
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
