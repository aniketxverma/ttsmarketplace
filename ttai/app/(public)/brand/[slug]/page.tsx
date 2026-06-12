import { notFound } from 'next/navigation'
import Image from 'next/image'
import {
  Crown, ShieldCheck, Award, Store, Lock, Heart, Share2, MapPin, Calendar,
  Package, Globe2, MessageCircle, UserPlus, Mail, Headphones,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BrandTabs } from './BrandTabs'
import { BrandLogo } from '@/components/BrandLogo'
import { canSeeB2B, tierRank } from '@/lib/business-chain'
import { translateCached } from '@/lib/i18n/content'
import { getLocale } from '@/lib/i18n/server'
import Link from 'next/link'

/** 2-letter ISO country code → flag emoji. */
const isoFlag = (iso?: string | null) =>
  iso && iso.length === 2
    ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : ''

export const revalidate = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Look up a supplier by brand_slug, or by id when the param is a UUID. Excludes suspended. */
function supplierQuery(supabase: ReturnType<typeof createClient>, slug: string, columns: string) {
  let q = (supabase.from('suppliers') as any).select(columns).neq('status', 'SUSPENDED')
  q = UUID_RE.test(slug) ? q.or(`brand_slug.eq.${slug},id.eq.${slug}`) : q.eq('brand_slug', slug)
  return q.limit(1).maybeSingle()
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: s } = await supplierQuery(
    supabase, params.slug,
    'trade_name, tagline, seo_title, seo_description, seo_keywords, og_image, logo_url'
  ) as { data: any }

  if (!s) return {}
  return {
    title:       s.seo_title       ?? `${s.trade_name} — Official Store · TTAI`,
    description: s.seo_description ?? s.tagline ?? `Shop ${s.trade_name} wholesale products on TTAI Marketplace`,
    keywords:    s.seo_keywords,
    openGraph: {
      title:       s.seo_title ?? s.trade_name,
      description: s.seo_description ?? s.tagline ?? '',
      images:      s.og_image ?? s.logo_url ? [{ url: s.og_image ?? s.logo_url! }] : [],
    },
  }
}

const TIER_CONFIG: Record<string, {
  label: string; bg: string; text: string; dot: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  GOLD:       { label: 'Gold Verified',     bg: 'bg-gradient-to-r from-amber-400 to-yellow-300', text: 'text-amber-900', dot: 'bg-amber-500',  Icon: Crown },
  SILVER:     { label: 'Verified Supplier', bg: 'bg-gradient-to-r from-slate-300 to-gray-200',   text: 'text-gray-800',  dot: 'bg-slate-400',  Icon: ShieldCheck },
  BRONZE:     { label: 'Bronze Supplier',   bg: 'bg-gradient-to-r from-orange-400 to-amber-300', text: 'text-orange-900',dot: 'bg-orange-500', Icon: Award },
  UNVERIFIED: { label: 'Supplier',          bg: 'bg-white/20',  text: 'text-white/80', dot: 'bg-gray-400', Icon: Store },
}


export default async function BrandPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: supplier } = await supplierQuery(supabase, params.slug, `
      id, owner_id, trade_name, legal_name, brand_slug, tagline, logo_url, banner_image,
      description, about_company, founded_year, employee_count, years_experience,
      countries_served, website, phone, whatsapp, business_email, working_hours,
      google_map_link, instagram, facebook, linkedin, twitter, youtube,
      reliability_tier, status, is_featured, badges, section_visibility,
      address_line1, address_line2, postal_code,
      countries(name, iso_code), cities(name)
    `) as { data: any }

  if (!supplier) notFound()

  // Premium brand accent colour (Shop Design) — defensive: column may not be migrated.
  let brandAccent = '#0B1F4D'
  try {
    const { data: bc } = await (supabase.from('suppliers') as any).select('brand_color').eq('id', supplier.id).maybeSingle()
    if (bc?.brand_color) brandAccent = bc.brand_color
  } catch { /* not migrated */ }

  // Check auth state — authenticated users see wholesale-only POS contacts
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  // Business-chain visibility: consumers (anonymous) don't see B2B/wholesale.
  // Seller CONTACT is members-only — only paid plans / admins / suppliers can see it.
  let viewerCanSeeB2B = false
  let contactUnlocked = false
  if (user) {
    const { data: viewer } = await (supabase.from('profiles') as any).select('role, tier, business_type').eq('id', user.id).single()
    viewerCanSeeB2B = canSeeB2B(viewer?.role, (viewer as any)?.business_type)
    const paid = viewer?.tier ? tierRank(viewer.tier) >= 1 : false
    const { data: ownSup } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
    contactUnlocked = paid || viewer?.role === 'admin' || !!ownSup
  }

  const [productsRes, galleryRes, certsRes, reviewsRes, docsRes, posRes, channelRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, description, category_id, product_images(url, sort_order), categories(id, name, parent_id)')
      .eq('supplier_id', supplier.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(500), // fetch the full catalogue so EVERY category is represented (BrandTabs groups by category)
    (supabase.from('brand_gallery' as any) as any)
      .select('id, url, type, caption, sort_order')
      .eq('supplier_id', supplier.id)
      .order('sort_order', { ascending: true }),
    (supabase.from('brand_certifications' as any) as any)
      .select('id, title, issuer, issued_date, expiry_date, image_url')
      .eq('supplier_id', supplier.id),
    (supabase.from('brand_reviews' as any) as any)
      .select('id, rating, comment, verified_purchase, supplier_reply, created_at, profiles(full_name)')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false }),
    // Public catalogs / price lists (migration 0052). Fall back to legacy shape.
    (async () => {
      const full = await supabase
        .from('supplier_documents')
        .select('id, doc_type, file_url, uploaded_at, title, file_name, file_size_bytes, is_public')
        .eq('supplier_id', supplier.id)
        .eq('is_public', true)
        .order('sort_order', { ascending: true })
      if (!full.error) return full
      return supabase
        .from('supplier_documents')
        .select('id, doc_type, file_url, uploaded_at')
        .eq('supplier_id', supplier.id)
    })(),
    // Try with shop columns (migration 0015); fallback to basic query if columns missing
    (async () => {
      const full = await (supabase.from('supplier_pos' as any) as any)
        .select(`
          id, name, type, status, is_public, sort_order,
          shop_active, shop_slug, shop_name, shop_tagline,
          pos_locations(*),
          pos_details(manager_name, phone, whatsapp, email, opening_hours, services_offered, accepts_walk_ins),
          pos_private_details(phone, whatsapp, notes)
        `)
        .eq('supplier_id', supplier.id)
        .eq('is_public', true)
        .order('sort_order', { ascending: true })
      if (!full.error) return full
      // Fallback without shop columns
      return (supabase.from('supplier_pos' as any) as any)
        .select('id, name, type, status, is_public, sort_order, pos_locations(*), pos_details(manager_name, phone, whatsapp, email, opening_hours, services_offered, accepts_walk_ins)')
        .eq('supplier_id', supplier.id)
        .eq('is_public', true)
        .order('sort_order', { ascending: true })
    })(),
    (supabase.from('supplier_channels' as any) as any)
      .select('id, name, description, whatsapp, member_count, post_count, invite_code')
      .eq('supplier_id', supplier.id)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const channel      = (channelRes.data ?? null) as any
  const channelPostsRes = channel
    ? await (supabase.from('channel_posts' as any) as any)
        .select('id, content, image_url, post_type, created_at')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const reviews = (reviewsRes.data ?? []) as any[]
  const avgRating = reviews.length
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0

  const country = supplier.countries as any as { name: string; iso_code: string } | null
  const city    = supplier.cities   as any as { name: string } | null
  const tier    = TIER_CONFIG[supplier.reliability_tier] ?? TIER_CONFIG.UNVERIFIED
  const sv      = (supplier.section_visibility ?? {}) as Record<string, boolean>

  // Fall back to the owner's account profile so an uploaded avatar / real name
  // still shows when the brand logo or trade name haven't been set yet.
  const { data: owner } = await (createAdminClient().from('profiles') as any)
    .select('avatar_url, full_name, company_name')
    .eq('id', supplier.owner_id)
    .maybeSingle()

  const looksLikeEmail = (s?: string | null) => !!s && s.includes('@')
  supplier.trade_name =
    (!looksLikeEmail(supplier.trade_name) && supplier.trade_name) ||
    (!looksLikeEmail(supplier.legal_name) && supplier.legal_name) ||
    owner?.company_name || owner?.full_name ||
    supplier.trade_name || supplier.legal_name || 'Supplier'
  if (!supplier.logo_url && owner?.avatar_url) supplier.logo_url = owner.avatar_url

  // Category tree → resolve each product's family (its category) + root (main category)
  // so the shop's left rail can show expandable Category → Family sections.
  const { data: allCats } = await supabase.from('categories').select('id, name, parent_id, sort_order, status')
  const catById = new Map<string, { id: string; name: string; parent_id: string | null; status?: string }>(
    (allCats ?? []).map((c: any) => [c.id, c])
  )
  const isActiveCat = (c: any) => !c || (c.status ?? 'active') === 'active'
  // Fixed list of MAIN categories (roots) — always shown in the shop (pending ones hidden).
  const categoryRoots = (allCats ?? [])
    .filter((c: any) => !c.parent_id && isActiveCat(c))
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((c: any) => ({ id: c.id, name: c.name }))
  const rootOf = (catId?: string | null) => {
    let cur = catId ? catById.get(catId) : undefined
    for (let i = 0; cur?.parent_id && i < 8; i++) cur = catById.get(cur.parent_id) ?? cur
    return cur ?? null
  }

  const products = (productsRes.data ?? []).map((p: any) => {
    const imgs = ((p.product_images ?? []) as { url: string; sort_order: number }[]).sort((a, b) => a.sort_order - b.sort_order)
    const leaf = p.category_id ? catById.get(p.category_id) : undefined
    const root = rootOf(p.category_id)
    // Pending (unapproved) categories don't group the product in the shop yet.
    const activeRoot = root && isActiveCat(root) ? root : null
    const family = leaf && activeRoot && leaf.id !== activeRoot.id ? { id: leaf.id, name: leaf.name } : null
    return {
      ...p,
      thumb: imgs[0]?.url ?? null,
      category_name: (p.categories as any)?.name ?? null,
      family,
      root: activeRoot ? { id: activeRoot.id, name: activeRoot.name } : null,
    }
  })

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/brand/${params.slug}`

  // Show the supplier's written content in the visitor's language (cached).
  const locale = await getLocale()
  if (locale && locale !== 'en') {
    const [tg, ab, de] = await Promise.all([
      translateCached(supplier.tagline ?? '', locale),
      translateCached(supplier.about_company ?? '', locale),
      translateCached(supplier.description ?? '', locale),
    ])
    supplier.tagline = tg || supplier.tagline
    supplier.about_company = ab || supplier.about_company
    supplier.description = de || supplier.description
  }

  // Matchmaking gate: hide all direct contact for non-members so every CTA below
  // (and the BrandTabs contact tab) collapses to the "Unlock contact" prompt.
  if (!contactUnlocked) {
    supplier.phone = null
    supplier.whatsapp = null
    supplier.business_email = null
    supplier.website = null
  }

  // WhatsApp helper
  const waHref = supplier.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi, I found your store on TTAI and I'd like to inquire about your products.`
    : null

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ══ BREADCRUMB + ACTIONS ════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
            <Link href="/" className="hover:text-[#0B1F4D] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/suppliers" className="hover:text-[#0B1F4D] transition-colors">Suppliers</Link>
            <span>/</span>
            <span className="text-gray-700 font-semibold truncate">{supplier.trade_name}</span>
          </nav>
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> Add to Favorites</span>
            <span className="flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share</span>
          </div>
        </div>
      </div>

      {/* ══ SUPPLIER HEADER CARD ═════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="h-1.5 w-full" style={{ backgroundColor: brandAccent }} />
         <div className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            {/* Logo + identity */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white flex-shrink-0">
                <BrandLogo src={supplier.logo_url} name={supplier.trade_name ?? supplier.legal_name ?? 'S'} size={84} textClass="text-3xl" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-[26px] font-extrabold text-[#0B1F4D] leading-tight">{supplier.trade_name ?? supplier.legal_name}</h1>
                  {supplier.reliability_tier !== 'UNVERIFIED' && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> {tier.label}
                    </span>
                  )}
                </div>
                {/* Meta chips */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[13px] text-gray-500">
                  {country && <span className="flex items-center gap-1.5">{isoFlag((country as any).iso_code) || '🌍'} {(country as any).name}</span>}
                  {city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {(city as any).name}</span>}
                  {supplier.founded_year && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Since {supplier.founded_year}</span>}
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-gray-400" /> {products.length} Products</span>
                  {supplier.countries_served && <span className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5 text-gray-400" /> {supplier.countries_served}+ Countries</span>}
                </div>
                {(supplier.tagline || supplier.description) && (
                  <p className="text-sm text-gray-500 mt-2.5 line-clamp-2 max-w-2xl">{supplier.tagline ?? supplier.description}</p>
                )}
              </div>
            </div>

            {/* Office image + actions */}
            <div className="flex items-stretch gap-3 flex-shrink-0">
              {supplier.banner_image && (
                <div className="hidden md:block relative w-44 h-[88px] rounded-xl overflow-hidden border border-gray-100">
                  <Image src={supplier.banner_image} alt="" fill className="object-cover" sizes="176px" />
                </div>
              )}
              <div className="flex flex-col gap-2 justify-center w-full sm:w-auto sm:min-w-[160px]">
                <Link href={isAuthenticated ? '/marketplace?supplier=' + supplier.id : '/register'}
                  style={{ backgroundColor: brandAccent }}
                  className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                  <UserPlus className="w-4 h-4" /> Follow Shop
                </Link>
                {contactUnlocked && waHref ? (
                  <a href={waHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-[#0B1F4D] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                    <MessageCircle className="w-4 h-4" /> Contact Supplier
                  </a>
                ) : contactUnlocked && supplier.business_email ? (
                  <a href={`mailto:${supplier.business_email}`}
                    className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-[#0B1F4D] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                    <Mail className="w-4 h-4" /> Contact Supplier
                  </a>
                ) : (
                  <Link href={isAuthenticated ? '/pricing' : '/register'}
                    className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-[#0B1F4D] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                    <Lock className="w-4 h-4" /> Contact Supplier
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
        <p className="text-sm text-gray-400 mt-2.5 px-1">{products.length} products</p>
      </div>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-5 pb-24 sm:pb-10">
        <BrandTabs
          supplier={supplier as any}
          products={products}
          gallery={(galleryRes.data ?? []) as any[]}
          certifications={(certsRes.data ?? []) as any[]}
          reviews={reviews}
          documents={(docsRes.data ?? []) as any[]}
          avgRating={avgRating}
          sectionVisibility={sv}
          pos={(posRes.data ?? []) as any[]}
          brandSlug={params.slug}
          shareUrl={shareUrl}
          channel={channel}
          channelPosts={(channelPostsRes.data ?? []) as any[]}
          isAuthenticated={isAuthenticated}
          canSeeB2B={viewerCanSeeB2B}
          contactUnlocked={contactUnlocked}
          categoryRoots={categoryRoots}
        />
      </div>

      {/* ══ TRUST BAR ════════════════════════════════════════════════════════ */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {[
            { Icon: ShieldCheck, title: 'Verified Supplier', sub: 'Identity & business verified' },
            { Icon: Lock,        title: 'Secure Payments',   sub: '100% secure & protected' },
            { Icon: Globe2,      title: 'Worldwide Shipping', sub: 'Fast & reliable delivery' },
            { Icon: Award,       title: 'Quality Guarantee', sub: '100% product quality' },
            { Icon: Headphones,  title: '24/7 Support',      sub: 'We are here to help' },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0">
                <t.Icon className="w-5 h-5 text-[#0B1F4D]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0B1F4D] leading-tight">{t.title}</p>
                <p className="text-xs text-gray-400 truncate">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MOBILE STICKY CTA ════════════════════════════════════════════════ */}
      {(supplier.whatsapp || supplier.phone) && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex gap-3">
          {supplier.whatsapp && (
            <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=Hi, I'd like to inquire about your products.`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-bold text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0B1F4D] text-white py-3 rounded-xl font-bold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Now
            </a>
          )}
        </div>
      )}
    </div>
  )
}
