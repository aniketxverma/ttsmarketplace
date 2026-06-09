import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag, Shield, TrendingUp, Globe, ArrowRight,
  Crown, ShieldCheck, Award, Store, Package, Users, CheckCircle2,
  Zap, BarChart3, Handshake,
} from 'lucide-react'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { CategoryNav } from '@/components/marketplace/CategoryNav'
import { Pagination } from '@/components/marketplace/Pagination'
import { tierRank } from '@/lib/business-chain'
import { dedupeProductsByMaster } from '@/lib/offers-server'
import { localizeCategoryNames } from '@/lib/i18n/categories'
import { getLocale } from '@/lib/i18n/server'
import type { Category } from '@/types/domain'

const TIER: Record<string, { label: string; Icon: typeof Crown; bg: string; text: string }> = {
  GOLD:       { label: 'Gold Verified',     Icon: Crown,       bg: 'bg-amber-100',  text: 'text-amber-700' },
  SILVER:     { label: 'Verified',          Icon: ShieldCheck, bg: 'bg-gray-100',   text: 'text-gray-600'  },
  BRONZE:     { label: 'Bronze',            Icon: Award,       bg: 'bg-orange-100', text: 'text-orange-600'},
  UNVERIFIED: { label: 'Supplier',          Icon: Store,       bg: 'bg-gray-50',    text: 'text-gray-500'  },
}

export default async function B2BPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string; supplier?: string }
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page ?? '1')
  const PAGE_SIZE = 24

  // ── Matchmaking gate ──────────────────────────────────────────────────
  // Open wholesale browse requires a paid plan. A direct link to one supplier's
  // own B2B shop (?supplier=…) passes through — that's governed by canSeeB2B.
  const { data: { user } } = await supabase.auth.getUser()
  let viewerTier = 'free'
  let viewerRole: string | null = null
  if (user) {
    const { data } = await (supabase.from('profiles') as any)
      .select('role, tier').eq('id', user.id).single()
    viewerTier = data?.tier ?? 'free'
    viewerRole = data?.role ?? null
  }
  const hasPaidPlan = tierRank(viewerTier) >= 1 || viewerRole === 'admin'

  if (!searchParams.supplier && !hasPaidPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] text-white py-20 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-5">
              <Package className="w-3.5 h-3.5" /> Wholesale marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Wholesale is a member benefit</h1>
            <p className="text-blue-200 text-lg">
              Browsing wholesale catalogs, MOQs and bulk pricing is part of your matchmaking membership.
              Activate a plan to unlock the B2B marketplace.
            </p>
          </div>
        </div>
        <div className="container mx-auto max-w-md px-4 py-16 text-center">
          <Link href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-8 py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors">
            View membership plans <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Already paid? Your plan is activated by our team — it will appear here once enabled.
          </p>
        </div>
      </div>
    )
  }

  // Fetch suppliers + categories in parallel
  const [suppliersRes, categoriesRes] = await Promise.all([
    (supabase as any)
      .from('suppliers')
      .select('id, trade_name, legal_name, brand_slug, logo_url, tagline, reliability_tier, years_experience, countries_served')
      .not('brand_slug', 'is', null)
      .eq('status', 'active')
      .order('reliability_tier', { ascending: true })
      .limit(12),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  const suppliers = suppliersRes.data ?? []
  const allCats   = await localizeCategoryNames(categoriesRes.data ?? [], await getLocale())

  // Category tree for sidebar
  const roots = allCats.filter((c: any) => c.parent_id === null) as Category[]
  const childMap: Record<string, Category[]> = {}
  allCats.forEach((c: any) => {
    if (c.parent_id) {
      if (!childMap[c.parent_id]) childMap[c.parent_id] = []
      childMap[c.parent_id].push(c as Category)
    }
  })
  const categoryTree = roots.map((r) => ({ ...r, children: childMap[r.id] ?? [] }))

  // Product counts per supplier
  const supplierIds = suppliers.map((s: any) => s.id)
  const { data: countRows } = await supabase
    .from('products')
    .select('supplier_id')
    .eq('is_published', true)
    .in('supplier_id', supplierIds.length ? supplierIds : ['__none__'])

  const productCounts: Record<string, number> = {}
  for (const row of (countRows ?? [])) {
    productCounts[row.supplier_id] = (productCounts[row.supplier_id] ?? 0) + 1
  }

  // Wholesale products. When scoped to one supplier (their own B2B shop), show ALL their
  // published products; global browse keeps the wholesale/both filter.
  let productQuery = (supabase
    .from('products') as any)
    .select(
      `id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
      suppliers!supplier_id!inner(legal_name, trade_name, reliability_tier, status),
      product_images(url, sort_order)`
    )
    .eq('is_published', true)

  if (searchParams.supplier) {
    productQuery = productQuery
      .eq('supplier_id', searchParams.supplier)
      .neq('suppliers.status', 'SUSPENDED')
  } else {
    productQuery = productQuery
      .eq('suppliers.status', 'ACTIVE')
      .in('marketplace_context', ['wholesale', 'both'])
  }

  if (searchParams.category) {
    const cat = allCats.find((c: any) => c.slug === searchParams.category)
    if (cat) productQuery = productQuery.eq('category_id', (cat as any).id)
  }
  if (searchParams.q) {
    productQuery = productQuery.ilike('name', `%${searchParams.q}%`)
  }

  const { data: allRows } = await productQuery
    .order('created_at', { ascending: false })
    .limit(500)

  // One product, many suppliers — collapse offers sharing a master into one card.
  // The Trade Hub sells under the house brand (TTAIEMA), so cards stay on the
  // house-brand product page and we do NOT reveal the supplier count.
  const deduped = await dedupeProductsByMaster(supabase, (allRows ?? []) as any[])
  const count = deduped.length
  const totalPages = Math.ceil(count / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE
  const products = deduped.slice(from, from + PAGE_SIZE)

  return (
    <div className="min-h-screen bg-white">

            {/* ── Header ── */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <p className="text-xs font-extrabold text-[#F5A623] uppercase tracking-widest mb-1">B2B Wholesale Hub</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Wholesale products</h1>
        </div>
      </div>

      {/* ── Wholesale product catalogue ─────────────────────── */}
      <div className="bg-[#F4F6FB] py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0B1F4D]">Wholesale Product Catalogue</h2>
              <p className="text-gray-400 text-sm mt-1">{count ?? 0} products available for bulk ordering</p>
            </div>
            <Link href="/marketplace" className="text-sm font-bold text-[#0B1F4D] hover:underline flex items-center gap-1">
              Full marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <SearchBar defaultValue={searchParams.q} />
          </div>

          <div className="flex gap-8">
            {/* Category sidebar */}
            <aside className="hidden md:block w-48 flex-shrink-0">
              <CategoryNav categories={categoryTree} />
            </aside>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              {(products?.length ?? 0) > 0 ? (
                <>
                  <ProductGrid>
                    {products!.map((p) => {
                      const supplier = p.suppliers as unknown as {
                        legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier
                      }
                      const images = p.product_images as { url: string; sort_order: number }[]
                      const mainImg = images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
                      return (
                        <ProductCard
                          key={p.id}
                          product={p as Parameters<typeof ProductCard>[0]['product']}
                          supplier={supplier}
                          mainImageUrl={mainImg}
                          href={`/product/${p.slug ?? p.id}?shop=b2b`}
                          shop="b2b"
                        />
                      )
                    })}
                  </ProductGrid>
                  <Pagination page={page} totalPages={totalPages} />
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No wholesale products found.</p>
                  {(searchParams.q || searchParams.category) && (
                    <Link href="/b2b" className="mt-3 inline-block text-sm font-bold text-[#0B1F4D] hover:underline">Clear filters</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3580] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to grow your business?</h2>
          <p className="text-white/60 text-base mb-8 leading-relaxed">
            Join hundreds of businesses already trading on TTAI EMA. Free to join, no subscription fees.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register"
              className="px-7 py-3.5 bg-[#F5A623] text-[#0B1F4D] rounded-xl font-extrabold text-sm hover:bg-[#fbb93a] transition-colors shadow-lg">
              Create Free Account
            </Link>
            <Link href="/marketplace"
              className="px-7 py-3.5 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
