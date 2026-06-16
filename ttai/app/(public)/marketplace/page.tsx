import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { FamilyCard } from '@/components/marketplace/FamilyCard'
import { groupIntoFamilies } from '@/lib/product-family'
import { dedupeByMaster } from '@/lib/offers'
import { localizeCategoryNames, localizeNames } from '@/lib/i18n/categories'
import { getLocale } from '@/lib/i18n/server'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { CategoryNav } from '@/components/marketplace/CategoryNav'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { Pagination } from '@/components/marketplace/Pagination'
import { PromotionBanner } from '@/components/marketplace/PromotionBanner'
import { SupplierMiniCard, type MiniSupplier } from '@/components/marketplace/SupplierMiniCard'
import { ShoppingChannels } from '@/components/marketplace/ShoppingChannels'
import { MarketplaceTopBar } from '@/components/marketplace/MarketplaceTopBar'
import { ShopCard, type ShopCardData } from '@/components/marketplace/ShopCard'
import { CategoryMall, type MallCat } from '@/components/marketplace/CategoryMall'
import { SupplierShopHeader } from '@/components/marketplace/SupplierShopHeader'
import { getMarketplaceOpen } from '@/lib/marketplace-phase'
import { OpeningSoon } from '@/components/OpeningSoon'
import { Smartphone, UtensilsCrossed, Car, SprayCan, Package } from 'lucide-react'
import type { Category } from '@/types/domain'

const PAGE_SIZE = 24
const SUB_SECTION_LIMIT = 10 // products shown per sub-category section on a category page

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// Coloured banner header used by both the homepage category sections and the
// per-category sub-section rows (Smartphones, Audio…). Keeps classification visible.
function CatBanner({ name, subs, accent, href, ctaLabel }: {
  name: string; subs?: string; accent: string; href?: string; ctaLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 rounded-xl px-4 py-3"
      style={{ background: `${accent}0F`, borderLeft: `4px solid ${accent}` }}>
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-extrabold leading-tight" style={{ color: accent }}>{name}</h2>
        {subs ? <p className="text-xs text-gray-500 truncate mt-0.5">{subs}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="flex-shrink-0 text-sm font-bold whitespace-nowrap inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: accent }}>
          {ctaLabel ?? 'Explore'} <ChevronRight />
        </Link>
      ) : null}
    </div>
  )
}

// Accent colour per root category (falls back to brand navy).
const CAT_ACCENT: Record<string, string> = {
  'electronics-technology': '#2563eb', 'electronics-tech': '#2563eb',
  'cleaning-household': '#16a34a',
  'food-beverage': '#ea580c', 'agriculture-food': '#ea580c',
  'home-appliances': '#0891b2',
  'health-beauty': '#db2777', 'personal-care': '#db2777',
  'logistics-supply-chain': '#64748b', 'consulting-services': '#0d9488',
  'textile-fashion': '#c026d3', 'construction-building': '#d97706', 'construction-materials': '#d97706',
  'automotive-transport': '#52525b', 'recycling-sustainability': '#059669',
  'industrial-manufacturing': '#4f46e5', 'healthcare-medical': '#e11d48',
}

// Icon per root category (for the category hero banner).
const CAT_ICON: Record<string, typeof Package> = {
  'electronics-technology': Smartphone, 'electronics-tech': Smartphone,
  'food-beverage': UtensilsCrossed, 'agriculture-food': UtensilsCrossed,
  'automotive-transport': Car,
  'cleaning-household': SprayCan,
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string; region?: string; supplier?: string; brand?: string; view?: string; country?: string; market?: string; province?: string; city?: string }
}) {
  const supabase = createClient()

  // Pre-Opening: the open marketplace browse is gated to launch day (admins preview).
  if (!(await getMarketplaceOpen())) {
    const { data: { user } } = await supabase.auth.getUser()
    let role: string | null = null
    if (user) { const { data } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single(); role = data?.role ?? null }
    if (role !== 'admin') return <OpeningSoon />
  }

  const page = parseInt(searchParams.page || '1')
  const activeRegion = searchParams.region ?? null
  const activeSupplier = searchParams.supplier ?? null
  const activeView: 'products' | 'shops' = searchParams.view === 'shops' ? 'shops' : 'products'
  const activeMarket = searchParams.market ?? 'europe'
  const activeCountryIso = (searchParams.country ?? '').toUpperCase()

  // Europe country banner → resolve the chosen ISO to a country_id (used to filter
  // both products and shops by the supplier's inherited country — Phase 7).
  let activeCountryId: string | null = null
  if (activeCountryIso) {
    const { data: c } = await (supabase.from('countries') as any)
      .select('id').eq('iso_code', activeCountryIso).maybeSingle()
    activeCountryId = c?.id ?? '00000000-0000-0000-0000-000000000000'
  }

  // Location drill-down: Continent → Country → Province → City/Area.
  const activeProvinceSlug = searchParams.province ?? ''
  const activeCitySlug = searchParams.city ?? ''
  let provincesForCountry: { name: string; slug: string }[] = []
  let citiesForProvince: { name: string; slug: string }[] = []
  let activeProvinceId: string | null = null
  let activeCityId: string | null = null
  if (activeCountryId && activeCountryIso) {
    const { data: provs } = await (supabase.from('provinces') as any)
      .select('id, name, slug').eq('country_id', activeCountryId).order('name')
    provincesForCountry = (provs ?? []).map((p: any) => ({ name: p.name, slug: p.slug }))
    if (activeProvinceSlug) {
      const prow = (provs ?? []).find((p: any) => p.slug === activeProvinceSlug)
      activeProvinceId = prow?.id ?? null
      if (activeProvinceId) {
        const { data: cs } = await (supabase.from('cities') as any)
          .select('id, name, slug').eq('province_id', activeProvinceId).order('name')
        citiesForProvince = (cs ?? []).map((c: any) => ({ name: c.name, slug: c.slug }))
        if (activeCitySlug) activeCityId = (cs ?? []).find((c: any) => c.slug === activeCitySlug)?.id ?? null
      }
    }
  }
  // Resolve province → supplier ids (supplier's city sits in this province).
  let provinceSupplierIds: string[] | null = null
  if (activeProvinceId && !activeCityId) {
    const { data: sc } = await (supabase.from('suppliers') as any)
      .select('id, cities!inner(province_id)').eq('cities.province_id', activeProvinceId)
    provinceSupplierIds = Array.from(new Set((sc ?? []).map((r: any) => r.id)))
    if (!provinceSupplierIds.length) provinceSupplierIds = ['00000000-0000-0000-0000-000000000000']
  }

  const [categoriesRes, promotionsRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase
      .from('broker_promotions')
      .select('id, custom_pitch, products(id, name, product_images(url, sort_order)), brokers(legal_name)')
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())
      .order('promotion_slot', { ascending: true })
      .limit(3),
  ])

  const locale = await getLocale()
  const allCats = await localizeCategoryNames(categoriesRes.data ?? [], locale)

  // When scoped to one supplier, this is their SHOP — load full shop data so the
  // buyer is guided to order everything from this one supplier (the core model:
  // we introduce buyers to suppliers, the supplier sells their whole catalogue).
  let shopSupplier: any = null
  if (activeSupplier) {
    const sel = (cols: string) => (supabase.from('suppliers') as any).select(cols).eq('id', activeSupplier).maybeSingle()
    let r = await sel('id, trade_name, legal_name, logo_url, brand_slug, tagline, description, reliability_tier, whatsapp, min_order_value_cents, catalogue_url, video_url, countries(name, iso_code), cities(name)')
    if (r.error) r = await sel('id, trade_name, legal_name, logo_url, brand_slug, reliability_tier, countries(name, iso_code)')
    shopSupplier = r.data ?? null
  }
  const scopedSupplierName: string | null = shopSupplier ? (shopSupplier.trade_name ?? shopSupplier.legal_name ?? null) : null
  // Pending (supplier-requested, not yet approved) categories stay hidden publicly.
  const isActiveCat = (c: any) => (c.status ?? 'active') === 'active'
  const roots = allCats.filter((c) => c.parent_id === null && isActiveCat(c)) as Category[]
  const childMap: Record<string, Category[]> = {}
  allCats.forEach((c) => {
    if (c.parent_id && isActiveCat(c)) {
      if (!childMap[c.parent_id]) childMap[c.parent_id] = []
      childMap[c.parent_id].push(c as Category)
    }
  })
  const categoryTree = roots.map((r) => ({ ...r, children: childMap[r.id] ?? [] }))

  // ── Only surface categories/families that actually have products ──────────
  // Counts every published product (active supplier, B2B context) up its category
  // chain, so the nav shows real, active categories with counts — empty ones hide.
  const { data: catProductRows } = await (supabase.from('products') as any)
    .select('category_id, suppliers!supplier_id!inner(status)')
    .eq('is_published', true)
    .eq('suppliers.status', 'ACTIVE')
    .in('marketplace_context', ['wholesale', 'both'])
    .limit(5000)
  const navCatById = new Map<string, any>(allCats.map((c: any) => [c.id, c]))
  const subtreeCount = new Map<string, number>()
  for (const row of (catProductRows ?? []) as any[]) {
    let cur = row.category_id ? navCatById.get(row.category_id) : null
    for (let i = 0; cur && i < 10; i++) {
      subtreeCount.set(cur.id, (subtreeCount.get(cur.id) ?? 0) + 1)
      cur = cur.parent_id ? navCatById.get(cur.parent_id) : null
    }
  }
  const navTree = categoryTree
    .filter((r) => (subtreeCount.get(r.id) ?? 0) > 0)
    .map((r) => ({
      ...r,
      count: subtreeCount.get(r.id) ?? 0,
      children: (r.children ?? [])
        .filter((c: any) => (subtreeCount.get(c.id) ?? 0) > 0)
        .map((c: any) => ({ ...c, count: subtreeCount.get(c.id) ?? 0 })),
    }))

  // Region filter — resolve the supplier ids serving the chosen region up front.
  // A country key like "europe:spain" must ALSO match suppliers who serve the whole
  // region ("europe") — serving all of Europe means serving Spain too.
  let regionSupplierIds: string[] | null = null
  if (activeRegion) {
    const parentRegion = activeRegion.includes(':') ? activeRegion.split(':')[0] : null
    const ors = [`region_key.eq.${activeRegion}`, `region_key.like.${activeRegion}:%`]
    if (parentRegion) ors.push(`region_key.eq.${parentRegion}`)
    const { data: srRows } = await (supabase.from('supplier_regions') as any)
      .select('supplier_id')
      .or(ors.join(','))
    regionSupplierIds = Array.from(new Set((srRows ?? []).map((r: any) => r.supplier_id)))
    if (!regionSupplierIds.length) regionSupplierIds = ['00000000-0000-0000-0000-000000000000']
  }

  // Build a fresh, fully-filtered product query (rebuilt per page so we can paginate).
  const mkQuery = () => {
    let q = (supabase.from('products') as any)
      .select(
        `id, name, slug, price_cents, retail_price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
        supplier_id, category_id, product_line, is_family_cover,
        suppliers!supplier_id!inner(legal_name, trade_name, reliability_tier, status, countries(name, iso_code), cities(name)),
        categories(name, slug),
        product_images(url, sort_order)`
      )
      .eq('is_published', true)
      .eq('suppliers.status', 'ACTIVE')
      .in('marketplace_context', ['wholesale', 'both'])
    if (activeSupplier) q = q.eq('supplier_id', activeSupplier)
    if (activeCountryId) q = q.eq('suppliers.country_id', activeCountryId)
    // Province / City drill-down filter (by the supplier's location).
    if (activeCityId) q = q.eq('suppliers.city_id', activeCityId)
    else if (provinceSupplierIds) q = q.in('supplier_id', provinceSupplierIds)
    if (searchParams.category) {
      const cat = allCats.find((c) => c.slug === searchParams.category)
      if (cat) {
        const childIds = allCats.filter((c) => c.parent_id === cat.id).map((c) => c.id)
        q = q.in('category_id', [cat.id, ...childIds])
      } else {
        q = q.eq('category_id', '00000000-0000-0000-0000-000000000000')
      }
    }
    if (searchParams.q) q = q.ilike('name', `%${searchParams.q}%`)
    if (regionSupplierIds) q = q.in('supplier_id', regionSupplierIds)
    return q
  }

  // Supabase caps a single response at ~1000 rows, so paginate to pull the whole
  // catalogue — otherwise the newest category (e.g. 1,392 XO items) fills the cap
  // and older categories (Food, Cleaning…) silently vanish from the grouped view.
  const PAGE = 1000
  const allProducts: any[] = []
  for (let off = 0; off < 6000; off += PAGE) {
    const { data: pageRows } = await mkQuery()
      .order('created_at', { ascending: false })
      .range(off, off + PAGE - 1)
    if (!pageRows || !pageRows.length) break
    allProducts.push(...pageRows)
    if (pageRows.length < PAGE) break
  }

  const prodList = (allProducts ?? []) as any[]

  // Phase 2 — attach brand + master link (defensive: columns may not be migrated yet).
  try {
    const ids = prodList.map((p) => p.id)
    if (ids.length) {
      const { data } = await (supabase.from('products') as any).select('id, brand_name, master_product_id, delivery_days').in('id', ids)
      const map = new Map((data ?? []).map((r: any) => [r.id, r]))
      for (const p of prodList) {
        const r: any = map.get(p.id)
        p.brand_name = r?.brand_name ?? null
        p.master_product_id = r?.master_product_id ?? null
        p.delivery_days = r?.delivery_days ?? null
        p.reliability_tier = p.suppliers?.reliability_tier ?? null // for offer ranking
      }
    }
  } catch { /* not migrated — no brands/master */ }

  // One product, many suppliers — collapse offers that share a master_product_id
  // into the single best-price representative so the marketplace shows ONE card.
  const deduped = dedupeByMaster(prodList as any) as any[]
  prodList.length = 0
  prodList.push(...deduped)

  // Show product names in the visitor's language (cards) — detail page already does.
  const localized = await localizeNames(prodList as any, locale)
  prodList.length = 0
  prodList.push(...localized)

  // Brand filter + the list of brands available (for the chips).
  const activeBrand = searchParams.brand ?? null
  const brandList = Array.from(new Set(prodList.map((p) => p.brand_name).filter(Boolean))).sort() as string[]
  const filteredProducts = activeBrand
    ? prodList.filter((p) => (p.brand_name ?? '').toLowerCase() === activeBrand.toLowerCase())
    : prodList

  // Supplier minimum order value per product (defensive — column may not be migrated).
  const supMin = new Map<string, number>()
  try {
    const sids = Array.from(new Set(prodList.map((p) => p.supplier_id).filter(Boolean)))
    if (sids.length) {
      const { data } = await (supabase.from('suppliers') as any).select('id, min_order_value_cents').in('id', sids)
      for (const s of (data ?? []) as any[]) if (s.min_order_value_cents > 0) supMin.set(s.id, s.min_order_value_cents)
    }
  } catch { /* not migrated */ }

  // Phase 6 — active sponsored product ids (defensive).
  const sponsoredSet = new Set<string>()
  try {
    const nowIso = new Date().toISOString()
    const { data: sp } = await (supabase.from('sponsored_placements') as any)
      .select('product_id, starts_at, ends_at').eq('kind', 'product').eq('is_active', true)
    for (const s of (sp ?? []) as any[]) {
      if (!s.product_id || (s.starts_at && s.starts_at > nowIso) || (s.ends_at && s.ends_at < nowIso)) continue
      sponsoredSet.add(s.product_id)
    }
  } catch { /* not migrated */ }

  const families = groupIntoFamilies(filteredProducts)
  const isSponsoredFam = (fam: typeof families[number]) => fam.members.some((m: any) => sponsoredSet.has(m.id))
  // Category-wise ordering (root → subcategory); sponsored boosted within a category.
  const ordKey = (cid: string) => {
    const c: any = navCatById.get(cid); if (!c) return 9_000_000
    const root: any = c.parent_id ? navCatById.get(c.parent_id) : c
    return (root?.sort_order ?? 8000) * 1000 + (c.parent_id ? (c.sort_order ?? 0) : 0)
  }
  families.sort((a, b) =>
    ordKey((a.representative as any).category_id) - ordKey((b.representative as any).category_id) ||
    (Number(isSponsoredFam(b)) - Number(isSponsoredFam(a))))
  const totalProducts = filteredProducts.length
  const totalPages = Math.ceil(families.length / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE
  const pageFamilies = families.slice(from, from + PAGE_SIZE)

  // ── Category-grouped "All Products" view (no specific category/search/supplier) ──
  const catById = new Map<string, any>(allCats.map((c: any) => [c.id, c]))
  const rootOf = (catId?: string | null): any => {
    let cur = catId ? catById.get(catId) : null
    for (let i = 0; cur && cur.parent_id && i < 10; i++) cur = catById.get(cur.parent_id)
    return cur ?? null
  }
  const isGroupedView = !searchParams.category && !searchParams.q && !activeSupplier && !activeBrand
  const categorySections: { cat: Category; families: typeof families }[] = []
  if (isGroupedView) {
    const byRoot = new Map<string, typeof families>()
    for (const fam of families) {
      const root = rootOf((fam.representative as any).category_id)
      if (!root) continue
      if (!byRoot.has(root.id)) byRoot.set(root.id, [])
      byRoot.get(root.id)!.push(fam)
    }
    for (const r of roots) {
      const fams = byRoot.get(r.id)
      if (fams && fams.length) categorySections.push({ cat: r, families: fams })
    }
  }
  // Mall-style homepage: one big banner card per product family (no mixed grid).
  const MALL_ICON: Record<string, string> = {
    'electronics-technology': 'smartphone', 'food-beverage': 'food',
    'cleaning-household': 'cleaning', 'automotive-transport': 'car',
  }
  const mallCats: MallCat[] = isGroupedView
    ? categorySections.map(({ cat, families: fams }) => {
        // Round-robin across sub-categories so the rail shows variety (a phone,
        // a cable, a charger, audio…) instead of five of the same product line.
        const bySub = new Map<string, typeof fams>()
        for (const f of fams) {
          const cid = (f.representative as any).category_id || cat.id
          if (!bySub.has(cid)) bySub.set(cid, [])
          bySub.get(cid)!.push(f)
        }
        const lists = Array.from(bySub.values()).map((l) => l.slice())
        const varied: typeof fams = []
        while (varied.length < 18 && lists.some((l) => l.length)) {
          for (const l of lists) { if (l.length) { varied.push(l.shift()!); if (varied.length >= 18) break } }
        }
        const products = varied
          .map((f) => {
            const p = f.representative as any
            const imgs = (p.product_images ?? []) as { url: string; sort_order: number }[]
            const img = imgs.slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? ''
            return { slug: p.slug ?? p.id, name: p.name as string, img, priceCents: p.price_cents as number, currency: (p.currency_code as string) ?? 'EUR' }
          })
          .filter((p) => p.img)
        return {
          name: cat.name,
          slug: cat.slug,
          accent: CAT_ACCENT[cat.slug] ?? '#0B1F4D',
          icon: MALL_ICON[cat.slug] ?? 'package',
          count: subtreeCount.get(cat.id) ?? fams.length,
          subs: (childMap[cat.id] ?? []).slice(0, 6).map((c) => c.name),
          products,
        }
      })
    : []

  // Supplier Shop sections — group THIS supplier's catalogue into their own
  // sections (like aisles in a store) so the buyer browses & orders it all here.
  const supplierShopSections: { cat: any; families: typeof families }[] = []
  if (activeSupplier) {
    const byCat = new Map<string, typeof families>()
    for (const f of families) {
      const cid = (f.representative as any).category_id || '_'
      if (!byCat.has(cid)) byCat.set(cid, [])
      byCat.get(cid)!.push(f)
    }
    const entries = Array.from(byCat.entries()).map(([cid, fams]) => ({
      cat: catById.get(cid) ?? { id: cid, name: 'Products', slug: '' },
      families: fams,
    }))
    entries.sort((a, b) => ordKey(a.cat.id) - ordKey(b.cat.id))
    supplierShopSections.push(...entries)
  }

  const promotions = (promotionsRes.data ?? []) as unknown as Parameters<typeof PromotionBanner>[0]['promotions']

  // ── Suppliers active in the selected category (so buyers see profiles, not just products) ──
  const activeCat = searchParams.category ? allCats.find((c) => c.slug === searchParams.category) : null
  let categorySuppliers: MiniSupplier[] = []
  if (activeCat) {
    // Include the category itself + any child categories
    const catIds = [activeCat.id, ...allCats.filter((c) => c.parent_id === activeCat.id).map((c) => c.id)]
    const { data: supRows } = await supabase
      .from('products')
      .select('supplier_id, suppliers!supplier_id!inner(id, legal_name, trade_name, logo_url, reliability_tier, brand_slug, tagline, status)')
      .eq('is_published', true)
      .eq('suppliers.status', 'ACTIVE')
      .in('category_id', catIds)

    // Dedupe by supplier + count their products in this category
    const map = new Map<string, MiniSupplier & { product_count: number }>()
    for (const row of (supRows ?? []) as any[]) {
      const s = row.suppliers
      if (!s) continue
      const existing = map.get(s.id)
      if (existing) { existing.product_count += 1 }
      else { map.set(s.id, { ...s, product_count: 1 }) }
    }
    categorySuppliers = Array.from(map.values())
      .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))
      .slice(0, 9)
  }

  // ── Sub-category sections for a category page ──────────────────────────────
  // When a buyer opens a category (e.g. Electronics), don't dump every product in
  // one flat wall (49 iPhones first…). Break it into sub-category sections —
  // Smartphones, Audio, Chargers… — each capped with a "view all" drill-down.
  const activeCatChildren = activeCat ? (childMap[activeCat.id] ?? []) : []
  const subSections: { cat: { id: string; name: string; slug: string }; families: typeof families }[] = []
  if (activeCat) {
    const famByCat = new Map<string, typeof families>()
    for (const fam of families) {
      const cid = (fam.representative as any).category_id
      if (!cid) continue
      if (!famByCat.has(cid)) famByCat.set(cid, [])
      famByCat.get(cid)!.push(fam)
    }
    const orderedChildren = [...activeCatChildren].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    for (const ch of orderedChildren) {
      const fams = famByCat.get((ch as any).id)
      if (fams && fams.length) subSections.push({ cat: ch as any, families: fams })
    }
    // Products attached straight to the parent category (no sub-category chosen).
    const direct = famByCat.get(activeCat.id)
    if (direct && direct.length) subSections.push({ cat: { id: activeCat.id, name: `More ${activeCat.name}`, slug: activeCat.slug }, families: direct })
  }
  const childSections = subSections.filter((s) => s.cat.id !== activeCat?.id)
  const showSubSections = childSections.length > 0

  // ── SHOPS view (Phase 1) — verified business profiles, filtered by category + country ──
  let shops: ShopCardData[] = []
  if (activeView === 'shops') {
    // business_type (migration 0053) may not be applied yet — fall back without it.
    const buildSupQ = (cols: string) => {
      let q = (supabase.from('suppliers') as any).select(cols).eq('status', 'ACTIVE')
        // B2B directory — only sellers whose shop type is wholesale or both.
        .in('marketplace_context', ['wholesale', 'both'])
      if (activeCountryId) q = q.eq('country_id', activeCountryId)
      return q.limit(200)
    }
    let supRes = await buildSupQ('id, legal_name, trade_name, logo_url, brand_slug, reliability_tier, tagline, description, country_id, business_type, countries(name)')
    if (supRes.error) supRes = await buildSupQ('id, legal_name, trade_name, logo_url, brand_slug, reliability_tier, tagline, description, country_id, countries(name)')
    let list = (supRes.data ?? []) as any[]

    // Category filter — only shops that carry a product in the chosen category.
    if (activeCat) {
      const catIds = [activeCat.id, ...allCats.filter((c) => c.parent_id === activeCat.id).map((c) => c.id)]
      const { data: pr } = await supabase.from('products').select('supplier_id').eq('is_published', true).in('category_id', catIds)
      const allowed = new Set((pr ?? []).map((r: any) => r.supplier_id))
      list = list.filter((s) => allowed.has(s.id))
    }

    // Product counts + top categories per shop (single query).
    const ids = list.map((s) => s.id)
    const counts = new Map<string, number>()
    const catNames = new Map<string, Set<string>>()
    if (ids.length) {
      const { data: pc } = await supabase.from('products').select('supplier_id, categories(name)').eq('is_published', true).in('supplier_id', ids).limit(2000)
      for (const r of (pc ?? []) as any[]) {
        counts.set(r.supplier_id, (counts.get(r.supplier_id) ?? 0) + 1)
        const nm = (r.categories as any)?.name
        if (nm) { if (!catNames.has(r.supplier_id)) catNames.set(r.supplier_id, new Set()); catNames.get(r.supplier_id)!.add(nm) }
      }
    }
    shops = list.map((s) => ({
      id: s.id, legal_name: s.legal_name, trade_name: s.trade_name, logo_url: s.logo_url,
      brand_slug: s.brand_slug, reliability_tier: s.reliability_tier,
      tagline: s.tagline ?? s.description ?? null,
      country_name: (s.countries as any)?.name ?? null,
      business_type: s.business_type ?? null,
      categories: Array.from(catNames.get(s.id) ?? []),
      product_count: counts.get(s.id) ?? 0,
    }))
    shops.sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))
  }

  const categoryLabel = activeCat?.name ?? null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Supplier Shop — the buyer has been guided to one supplier; order it all here. */}
      {shopSupplier && <SupplierShopHeader s={shopSupplier} productCount={totalProducts} />}

      <div className="mb-6">
        {scopedSupplierName ? null : (
          <>
            <h1 className="text-2xl font-bold">{categoryLabel ?? 'Wholesale Marketplace'}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {categoryLabel
                ? `${totalProducts} products · browse by section below`
                : `${totalProducts} products from verified suppliers`}
            </p>
          </>
        )}
      </div>

      <div className="mb-4">
        <SearchBar defaultValue={searchParams.q} />
      </div>

      {/* ── Brand filter ── */}
      {brandList.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1">Brand:</span>
          {[{ v: '', label: 'All Brands' }, ...brandList.map((b) => ({ v: b, label: b }))].map(({ v, label }) => {
            const params = new URLSearchParams()
            if (v) params.set('brand', v)
            if (searchParams.category) params.set('category', searchParams.category)
            if (activeRegion) params.set('region', activeRegion)
            if (activeSupplier) params.set('supplier', activeSupplier)
            const on = (v || '') === (activeBrand || '')
            return (
              <Link key={label} href={`/marketplace${params.toString() ? `?${params.toString()}` : ''}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${on ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Products | Shops tabs + Europe country banner (dynamic, no reload) ── */}
      <MarketplaceTopBar activeView={activeView} activeCountry={activeCountryIso} activeMarket={activeMarket} categoryLabel={categoryLabel}
        provinces={provincesForCountry} cities={citiesForProvince} activeProvince={activeProvinceSlug} activeCity={activeCitySlug} />

      <PromotionBanner promotions={promotions} />

      {/* ── Category hero banner (when a category is open) ── */}
      {activeCat && activeView !== 'shops' && (() => {
        const accent = CAT_ACCENT[activeCat.slug] ?? '#0B1F4D'
        const Icon = CAT_ICON[activeCat.slug] ?? Package
        const subs = (childMap[activeCat.id] ?? []).slice(0, 6).map((c: any) => c.name).join(' · ')
        return (
          <div className="rounded-2xl mb-6 px-5 sm:px-7 py-5 flex items-center gap-4 shadow-sm" style={{ background: accent }}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{activeCat.name}</h2>
              <p className="text-white/80 text-sm mt-0.5 truncate">{subs || `Explore our range of ${activeCat.name}`}</p>
            </div>
          </div>
        )
      })()}

      <div className="flex gap-8">
        <aside className="hidden md:block w-48 flex-shrink-0">
          <CategoryNav categories={navTree} />
        </aside>

        <div className="flex-1 min-w-0">
          {activeView === 'shops' ? (
            shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shops.map((s) => <ShopCard key={s.id} shop={s} />)}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No shops found</p>
                <p className="text-sm mt-1">Try a different category or country</p>
              </div>
            )
          ) : (
          <>
          {/* Three ways to shop this collection */}
          {activeCat && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">
                  Shop {activeCat.name} via
                </h2>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
              <ShoppingChannels categorySlug={activeCat.slug} compact />
            </div>
          )}

          {/* Suppliers active in this category — surfaces profiles, not just products */}
          {activeCat && categorySuppliers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">
                  Suppliers in {activeCat.name}
                </h2>
                <Link href="/suppliers" className="text-xs font-bold text-[#0B1F4D] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorySuppliers.map((s) => (
                  <SupplierMiniCard key={s.id} supplier={s} />
                ))}
              </div>
              <div className="mt-6 mb-2 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Products</span>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
            </div>
          )}

          {(() => {
            // One renderer reused by both the grouped sections and the flat grid.
            const renderCard = (fam: typeof families[number]) => {
              const sponsored = isSponsoredFam(fam)
              const brand = (fam.representative as any).brand_name ?? null
              const minOrderCents = supMin.get((fam.representative as any).supplier_id) ?? 0
              const offerCount = (fam.representative as any)._offerCount ?? 0
              if (fam.members.length > 1) return <FamilyCard key={fam.key} family={fam} shop="market" brand={brand} sponsored={sponsored} minOrderCents={minOrderCents} />
              const p = fam.representative as any
              const sup = p.suppliers as { legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier; countries?: { name: string; iso_code: string } | null; cities?: { name: string } | null }
              const supplier = { ...sup, country_name: sup.countries?.name ?? null, country_iso: sup.countries?.iso_code ?? null, city_name: sup.cities?.name ?? null }
              const mainImg = (p.product_images as { url: string; sort_order: number }[])?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
              // Deduped card → the best offer's product page (which lists all sellers).
              const href = `/product/${p.slug ?? p.id}`
              return (
                <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]['product']}
                  supplier={supplier} mainImageUrl={mainImg} href={href} shop="market" brand={brand} sponsored={sponsored} minOrderCents={minOrderCents} offerCount={offerCount} />
              )
            }

            // Supplier Shop → the supplier's whole catalogue in their own sections.
            if (activeSupplier && supplierShopSections.length > 0) {
              return (
                <div className="space-y-10">
                  {supplierShopSections.map(({ cat, families: fams }) => {
                    const href = cat.slug ? `/marketplace?supplier=${activeSupplier}&category=${cat.slug}` : undefined
                    const accent = CAT_ACCENT[rootOf(cat.id)?.slug] ?? '#0B1F4D'
                    return (
                      <section key={cat.id}>
                        <CatBanner
                          name={cat.name}
                          accent={accent}
                          href={href && fams.length > SUB_SECTION_LIMIT ? href : undefined}
                          ctaLabel={`View all ${fams.length}`}
                        />
                        <ProductGrid>{fams.slice(0, SUB_SECTION_LIMIT).map(renderCard)}</ProductGrid>
                        {href && fams.length > SUB_SECTION_LIMIT && (
                          <div className="mt-4 text-center">
                            <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
                              View all {fams.length} in {cat.name}
                            </Link>
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              )
            }

            // Category page → sub-category sections (Smartphones, Audio…) instead of a flat wall.
            if (showSubSections) {
              const accent = CAT_ACCENT[activeCat!.slug] ?? '#0B1F4D'
              return (
                <div className="space-y-10">
                  {subSections.map(({ cat, families: fams }) => {
                    const isDirect = cat.id === activeCat!.id
                    const href = `/marketplace?category=${cat.slug}${activeRegion ? `&region=${activeRegion}` : ''}`
                    // Guide the buyer to the supplier(s) behind this sub-category.
                    const sups = new Map<string, string>()
                    for (const f of fams) {
                      const p: any = f.representative
                      if (p.supplier_id && !sups.has(p.supplier_id)) sups.set(p.supplier_id, p.suppliers?.trade_name ?? p.suppliers?.legal_name ?? 'Supplier')
                    }
                    const supList = Array.from(sups.entries())
                    return (
                      <section key={cat.id}>
                        <CatBanner
                          name={cat.name}
                          accent={accent}
                          href={isDirect ? undefined : href}
                          ctaLabel={fams.length > SUB_SECTION_LIMIT ? `View all ${fams.length}` : 'View all'}
                        />
                        {supList.length > 0 && (
                          <div className="-mt-2 mb-4 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-gray-400">{supList.length > 1 ? 'Suppliers:' : 'Sold by:'}</span>
                            {supList.slice(0, 4).map(([id, nm]) => (
                              <Link key={id} href={`/marketplace?supplier=${id}`}
                                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
                                {nm} <span className="text-gray-400">· visit shop →</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        <ProductGrid>{fams.slice(0, SUB_SECTION_LIMIT).map(renderCard)}</ProductGrid>
                        {!isDirect && fams.length > SUB_SECTION_LIMIT && (
                          <div className="mt-4 text-center">
                            <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors">
                              View all {fams.length} in {cat.name}
                            </Link>
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              )
            }

            // Homepage → mall directory: big banner per product family (no product wall).
            if (isGroupedView && mallCats.length > 0) {
              return <CategoryMall categories={mallCats} />
            }

            if (pageFamilies.length > 0) {
              return (
                <>
                  <ProductGrid>{pageFamilies.map(renderCard)}</ProductGrid>
                  <Pagination page={page} totalPages={totalPages} />
                </>
              )
            }

            return (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search query</p>
              </div>
            )
          })()}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
