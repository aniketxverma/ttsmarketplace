import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'
import { PublishToggle } from './PublishToggle'

const FILTERS = ['all', 'published', 'draft']

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { filter?: string; supplier?: string }
}) {
  await requireRole('admin')
  const supabase = createClient()

  const filter = searchParams.filter ?? 'all'

  let query = supabase
    .from('products')
    .select('id, name, slug, price_cents, currency_code, is_published, stock_qty, sku, created_at, suppliers(trade_name, legal_name), categories(name), product_images(url, sort_order)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'published') query = query.eq('is_published', true)
  if (filter === 'draft')     query = query.eq('is_published', false)

  const { data: products } = await query

  const [pubCount, draftCount] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_published', false),
  ])

  const counts: Record<string, number> = {
    all:       (pubCount.count ?? 0) + (draftCount.count ?? 0),
    published: pubCount.count ?? 0,
    draft:     draftCount.count ?? 0,
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{counts.all} products across all suppliers</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = f === filter
          return (
            <a
              key={f}
              href={f === 'all' ? '/admin/products' : `/admin/products?filter=${f}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                isActive ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-70">{counts[f]}</span>
            </a>
          )
        })}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Supplier</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium">Price</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Stock</th>
              <th className="text-left px-4 py-3 font-medium">Published</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((p) => {
              const supplier = p.suppliers as any as { trade_name: string | null; legal_name: string } | null
              const category = p.categories as any as { name: string } | null
              const images = ((p.product_images ?? []) as { url: string; sort_order: number }[])
                .sort((a, b) => a.sort_order - b.sort_order)
              const thumb = images[0]?.url

              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                        {thumb ? (
                          <Image src={thumb} alt={p.name} fill className="object-cover" sizes="36px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">📦</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[180px]">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {supplier?.trade_name ?? supplier?.legal_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCents(p.price_cents, p.currency_code)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-sm font-medium ${p.stock_qty === 0 ? 'text-red-500' : p.stock_qty < 10 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {p.stock_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle productId={p.id} isPublished={p.is_published} />
                  </td>
                </tr>
              )
            })}
            {!products?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
