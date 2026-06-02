import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Search, Star, ArrowRight, Zap, Truck, Shield, RotateCcw } from 'lucide-react'

export const revalidate = 60

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string }
}) {
  const supabase = createClient()
  const category = searchParams.category ?? null
  const q        = searchParams.q ?? null

  let query = (supabase as any)
    .from('products')
    .select(`
      id, name, slug, price_cents, currency_code, min_order_qty, stock_qty,
      product_images(url, sort_order),
      categories(name, slug),
      suppliers(trade_name, legal_name, logo_url, brand_slug)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(48)

  if (q) query = query.ilike('name', `%${q}%`)

  const { data: productsRaw } = await query

  const products = (productsRaw ?? []).map((p: any) => ({
    ...p,
    thumb:    ((p.product_images ?? []) as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null,
    catName:  p.categories?.name ?? null,
    catSlug:  p.categories?.slug ?? null,
    supplier: p.suppliers ?? null,
  })).filter((p: any) => !category || p.catSlug === category)

  const { data: categoriesRaw } = await supabase.from('categories').select('id, name, slug').order('name')
  const categories = categoriesRaw ?? []

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3 h-3 text-[#F5A623]" />Online Store · Direct from Suppliers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Shop Direct.<br /><span className="text-purple-200">No Middleman.</span>
          </h1>
          <p className="text-white/60 text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Browse products directly from verified suppliers. Competitive pricing, guaranteed quality.
          </p>
          <form method="GET" action="/store" className="flex gap-2 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input name="q" defaultValue={q ?? ''}
                placeholder="Search products…"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
            </div>
            <button type="submit"
              className="px-5 py-3 bg-[#F5A623] text-[#0B1F4D] rounded-xl font-extrabold text-sm hover:bg-[#fbb93a] transition-colors shadow-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Trust bar ────────────────────────────────────────────────── */}
      <div className="border-b bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap justify-center sm:justify-between items-center gap-4">
          {[
            { Icon: Shield,    text: 'Verified Suppliers' },
            { Icon: Truck,     text: 'Direct Shipping' },
            { Icon: Star,      text: 'Quality Guaranteed' },
            { Icon: RotateCcw, text: 'Transparent Pricing' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <Icon className="w-3.5 h-3.5 text-purple-600" />{text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-48 shrink-0">
            <div className="lg:sticky lg:top-20">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Categories</p>
              <div className="space-y-1">
                <Link href="/store"
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${!category ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                  All Products
                </Link>
                {categories.map((c: any) => (
                  <Link key={c.id} href={`/store?category=${c.slug}`}
                    className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${category === c.slug ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {products.length > 0 ? `${products.length} product${products.length !== 1 ? 's' : ''}` : 'No products found'}
                {q && <> for "<strong>{q}</strong>"</>}
              </p>
              {(q || category) && (
                <Link href="/store" className="text-xs font-bold text-purple-600 hover:underline">Clear filters</Link>
              )}
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">No products found.</p>
                <Link href="/store" className="mt-3 inline-block text-sm font-bold text-purple-600 hover:underline">Browse all</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <Link key={p.id} href={`/product/${p.slug ?? p.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {p.thumb ? (
                        <Image src={p.thumb} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                      {p.stock_qty > 0 && (
                        <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          In Stock
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {p.catName && (
                        <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide mb-0.5">{p.catName}</p>
                      )}
                      <h3 className="text-xs font-extrabold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-purple-700 transition-colors">
                        {p.name}
                      </h3>
                      {p.supplier && (
                        <div className="flex items-center gap-1.5 mb-2">
                          {p.supplier.logo_url ? (
                            <Image src={p.supplier.logo_url} alt="" width={14} height={14} className="rounded-full object-cover" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-[#0B1F4D] flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">{(p.supplier.trade_name ?? 'S')[0]}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-gray-400 truncate">{p.supplier.trade_name ?? p.supplier.legal_name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-extrabold text-[#0B1F4D]">{fmt(p.price_cents, p.currency_code)}</p>
                        <span className="text-[10px] text-gray-400">MOQ {p.min_order_qty}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {products.length >= 48 && (
              <div className="text-center mt-10">
                <Link href="/marketplace"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0B1F4D] text-white rounded-xl font-bold text-sm hover:bg-[#162d6e] transition-colors">
                  View Full Marketplace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
