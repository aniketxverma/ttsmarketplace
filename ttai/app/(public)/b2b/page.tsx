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
import { dedupeProductsByMaster } from '@/lib/offers-server'
import { localizeCategoryNames } from '@/lib/i18n/categories'
import { getLocale } from '@/lib/i18n/server'
import type { Category } from '@/types/domain'

const CAT_ACCENT: Record<string, string> = {
  'electronics-technology': '#2563eb', 'food-beverage': '#ea580c',
  'cleaning-household': '#16a34a', 'automotive-transport': '#52525b',
}

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

  // The Trade Hub is TTAI EMA's own public B2B catalogue — open to everyone
  // (logged in or not). No membership paywall here.

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
      `id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate, brand_name, category_id,
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
    // Phase 1: the Trade Hub sells under TTAI EMA only. Restrict to house sellers
    // when one is designated (defensive — column may not be migrated yet).
    try {
      const { data: houseRows } = await (supabase.from('suppliers') as any).select('id').eq('is_house', true)
      const houseIds = (houseRows ?? []).map((r: any) => r.id)
      if (houseIds.length) productQuery = productQuery.in('supplier_id', houseIds)
    } catch { /* is_house not migrated — show all wholesale (transition) */ }
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

  // Category-wise ordering — group products by category (not by recency) so the
  // grid reads Electronics, then the next category, and so on.
  const catById: Record<string, any> = Object.fromEntries((allCats as any[]).map((c) => [c.id, c]))
  const ordKey = (cid: string) => {
    const c = catById[cid]; if (!c) return 9_000_000
    const root = c.parent_id ? catById[c.parent_id] : c
    return (root?.sort_order ?? 8000) * 1000 + (c.parent_id ? (c.sort_order ?? 0) : 0)
  }
  ;(deduped as any[]).sort((a, b) => ordKey(a.category_id) - ordKey(b.category_id) || String(a.name).localeCompare(String(b.name)))

  const count = deduped.length
  const totalPages = Math.ceil(count / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE
  const products = deduped.slice(from, from + PAGE_SIZE)

  // ── Category-grouped sections (like the marketplace) ──────────────────────
  // On the main catalogue (no filter) show one banner section per category —
  // Electronics, then Food, then Cleaning… — capped with a "view all" drill-down,
  // instead of a flat wall mixing every category together.
  const rootOf = (cid?: string | null): any => {
    let c = cid ? catById[cid] : null
    for (let i = 0; c && c.parent_id && i < 10; i++) c = catById[c.parent_id]
    return c ?? null
  }
  const SECTION_CAP = 10
  const isGrouped = !searchParams.category && !searchParams.q && !searchParams.supplier
  const sections: { root: any; items: any[] }[] = []
  if (isGrouped) {
    const byRoot = new Map<string, { root: any; items: any[] }>()
    for (const p of deduped as any[]) {
      const r = rootOf(p.category_id)
      if (!r) continue
      if (!byRoot.has(r.id)) byRoot.set(r.id, { root: r, items: [] })
      byRoot.get(r.id)!.items.push(p)
    }
    sections.push(...Array.from(byRoot.values()).sort((a, b) => ordKey(a.root.id) - ordKey(b.root.id)))
  }

  return (
    <div className="min-h-screen bg-white">

            {/* ── Header ── */}
      <div className="border-b bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6">
          <p className="text-xs font-extrabold text-[#F5A623] uppercase tracking-widest mb-1">B2B Wholesale Hub</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Wholesale products</h1>
        </div>
      </div>

      {/* ── Wholesale product catalogue ─────────────────────── */}
      <div className="bg-[#F4F6FB] py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
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
              {isGrouped && sections.length > 0 ? (
                <div className="space-y-10">
                  {sections.map(({ root, items }) => {
                    const accent = CAT_ACCENT[root.slug] ?? '#0B1F4D'
                    const href = `/b2b?category=${root.slug}`
                    const supplier = (p: any) => p.suppliers as unknown as { legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier }
                    return (
                      <section key={root.id}>
                        <div className="flex items-center justify-between gap-3 mb-4 rounded-xl px-4 py-3"
                          style={{ background: `${accent}0F`, borderLeft: `4px solid ${accent}` }}>
                          <h2 className="text-lg sm:text-xl font-extrabold leading-tight" style={{ color: accent }}>
                            {root.name} <span className="text-sm font-bold opacity-60">· {items.length}</span>
                          </h2>
                          {items.length > SECTION_CAP && (
                            <Link href={href} className="flex-shrink-0 text-sm font-bold whitespace-nowrap inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: accent }}>
                              View all {items.length} <ArrowRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                        <ProductGrid>
                          {items.slice(0, SECTION_CAP).map((p) => {
                            const images = p.product_images as { url: string; sort_order: number }[]
                            const mainImg = images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url
                            return (
                              <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]['product']}
                                supplier={supplier(p)} mainImageUrl={mainImg} href={`/product/${p.slug ?? p.id}?shop=b2b`} shop="b2b" brand={p.brand_name ?? null} />
                            )
                          })}
                        </ProductGrid>
                        {items.length > SECTION_CAP && (
                          <div className="mt-4 text-center">
                            <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
                              View all {items.length} in {root.name}
                            </Link>
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              ) : (products?.length ?? 0) > 0 ? (
                <>
                  <ProductGrid>
                    {products!.map((p) => {
                      const supplier = p.suppliers as unknown as {
                        legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier
                      }
                      const images = p.product_images as { url: string; sort_order: number }[]
                      const mainImg = images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url
                      return (
                        <ProductCard
                          key={p.id}
                          product={p as Parameters<typeof ProductCard>[0]['product']}
                          supplier={supplier}
                          mainImageUrl={mainImg}
                          href={`/product/${p.slug ?? p.id}?shop=b2b`}
                          shop="b2b"
                          brand={(p as any).brand_name ?? null}
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
