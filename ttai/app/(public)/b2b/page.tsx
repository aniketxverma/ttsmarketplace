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
  const allCats   = categoriesRes.data ?? []

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
  let productQuery = supabase
    .from('products')
    .select(
      `id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
      suppliers!inner(legal_name, trade_name, reliability_tier, status),
      product_images(url, sort_order)`,
      { count: 'exact' }
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

  const from = (page - 1) * PAGE_SIZE
  const { data: products, count } = await productQuery
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1F4D] via-[#0d2660] to-[#1a3a8a]">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/[0.03]" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-[#F5A623]/10" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#F5A623]/20 border border-[#F5A623]/30 text-[#F5A623] text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3 h-3" />B2B Wholesale Platform
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
              Trade Wholesale<br />
              <span className="text-[#F5A623]">with Confidence</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
              Connect directly with verified European suppliers. Bulk orders, competitive pricing, and full supply chain transparency — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] text-[#0B1F4D] rounded-xl font-extrabold text-sm hover:bg-[#fbb93a] transition-colors shadow-lg">
                <ShoppingBag className="w-4 h-4" />Browse Products
              </Link>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                <Handshake className="w-4 h-4" />List Your Products Free
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center sm:text-left">
              {[
                { value: '200+', label: 'Verified Suppliers' },
                { value: '15+',  label: 'Countries' },
                { value: '1K+',  label: 'Products Listed' },
                { value: '€0',   label: 'Platform Fee' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-white">{value}</p>
                  <p className="text-xs text-white/50 mt-0.5 font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center mb-3">How It Works</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] text-center mb-10">
          Start trading in 3 simple steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', Icon: Globe,       title: 'Browse & Discover',   desc: 'Explore hundreds of verified suppliers across Europe, Africa and the Mediterranean region. Filter by category, country and reliability tier.' },
            { step: '02', Icon: Handshake,   title: 'Connect & Negotiate', desc: 'Contact suppliers directly via WhatsApp or email. Negotiate pricing, MOQs and payment terms with no middleman.' },
            { step: '03', Icon: TrendingUp,  title: 'Order & Grow',        desc: 'Place your bulk order with confidence. Track deliveries, manage invoices and build long-term supplier relationships.' },
          ].map(({ step, Icon, title, desc }) => (
            <div key={step} className="relative bg-[#F4F6FB] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-7xl font-black text-[#0B1F4D]/5 absolute top-4 right-5 leading-none select-none">{step}</div>
              <div className="w-12 h-12 rounded-2xl bg-[#0B1F4D] flex items-center justify-center mb-4 shadow-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-extrabold text-[#0B1F4D] text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why B2B with TTAI ────────────────────────────────────────────── */}
      <div className="bg-[#F4F6FB] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl font-extrabold text-[#0B1F4D] text-center mb-10">Why trade with TTAI?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { Icon: Shield,       title: 'Verified Suppliers Only',  desc: 'Every supplier is ID-verified and rated. Gold, Silver, and Bronze tiers reflect real due-diligence.' },
              { Icon: BarChart3,    title: 'Transparent Pricing',      desc: 'Prices displayed are ex-VAT wholesale rates. No hidden fees, no inflated margins.' },
              { Icon: Globe,        title: 'Mediterranean Reach',      desc: 'Suppliers across Spain, Morocco, Algeria, Tunisia, France, and beyond.' },
              { Icon: Zap,          title: 'Fast Connections',         desc: 'WhatsApp-enabled supplier contact means deals happen in hours, not weeks.' },
              { Icon: Package,      title: 'Bulk-Ready Products',      desc: 'Every listing shows MOQ and available stock upfront. No surprises.' },
              { Icon: CheckCircle2, title: 'Free for Buyers',          desc: 'Create a free buyer account and start contacting suppliers today. No subscription required.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#0B1F4D]/8 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#0B1F4D]" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Suppliers Grid ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0B1F4D]">Featured B2B Suppliers</h2>
            <p className="text-gray-400 text-sm mt-1">Verified suppliers ready for wholesale orders</p>
          </div>
          <Link href="/marketplace" className="text-sm font-bold text-[#0B1F4D] hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-20 bg-[#F4F6FB] rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">No suppliers listed yet.</p>
            <Link href="/register" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0B1F4D] hover:underline">
              Register as a supplier →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suppliers.map((s: any) => {
              const tier = TIER[s.reliability_tier ?? 'UNVERIFIED'] ?? TIER.UNVERIFIED
              const count = productCounts[s.id] ?? 0
              return (
                <Link key={s.id} href={`/brand/${s.brand_slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
                  {/* Top accent */}
                  <div className="h-1 bg-gradient-to-r from-[#0B1F4D] to-[#1a3580]" />
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                        {s.logo_url ? (
                          <Image src={s.logo_url} alt={s.trade_name ?? ''} width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0B1F4D]">
                            <span className="text-white font-extrabold text-xl">{(s.trade_name ?? s.legal_name ?? 'S')[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-gray-900 text-sm truncate group-hover:text-[#0B1F4D]">
                          {s.trade_name ?? s.legal_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${tier.bg} ${tier.text}`}>
                          <tier.Icon className="w-2.5 h-2.5" />{tier.label}
                        </span>
                      </div>
                    </div>
                    {s.tagline && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{s.tagline}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50">
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" />{count} products</span>
                      {s.years_experience > 0 && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{s.years_experience} yrs</span>}
                      {s.countries_served > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{s.countries_served} countries</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Wholesale product catalogue ─────────────────────────────────── */}
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
