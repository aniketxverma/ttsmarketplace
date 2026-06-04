import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Crown, ShieldCheck, Award, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BrandTabs } from './BrandTabs'
import { StatsBar } from './StatsBar'
import { BrandLogo } from '@/components/BrandLogo'
import { canSeeB2B } from '@/lib/business-chain'

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

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-white/90">{rating.toFixed(1)}</span>
      {count > 0 && <span className="text-sm text-white/60">({count})</span>}
    </div>
  )
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: supplier } = await supplierQuery(supabase, params.slug, `
      id, trade_name, legal_name, brand_slug, tagline, logo_url, banner_image,
      description, about_company, founded_year, employee_count, years_experience,
      countries_served, website, phone, whatsapp, business_email, working_hours,
      google_map_link, instagram, facebook, linkedin, twitter, youtube,
      reliability_tier, status, is_featured, badges, section_visibility,
      address_line1, address_line2, postal_code,
      countries(name, iso_code), cities(name)
    `) as { data: any }

  if (!supplier) notFound()

  // Check auth state — authenticated users see wholesale-only POS contacts
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  // Business-chain visibility: consumers (anonymous) don't see B2B/wholesale
  let viewerCanSeeB2B = false
  if (user) {
    const { data: viewer } = await supabase.from('profiles').select('role, business_type').eq('id', user.id).single()
    viewerCanSeeB2B = canSeeB2B(viewer?.role, (viewer as any)?.business_type)
  }

  const [productsRes, galleryRes, certsRes, reviewsRes, docsRes, posRes, channelRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price_cents, currency_code, min_order_qty, description, product_images(url, sort_order), categories(name)')
      .eq('supplier_id', supplier.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(24),
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
    supabase
      .from('supplier_documents')
      .select('id, doc_type, file_url, uploaded_at')
      .eq('supplier_id', supplier.id),
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
  const badges  = (supplier.badges ?? []) as string[]

  const products = (productsRes.data ?? []).map((p: any) => {
    const imgs = ((p.product_images ?? []) as { url: string; sort_order: number }[]).sort((a, b) => a.sort_order - b.sort_order)
    return { ...p, thumb: imgs[0]?.url ?? null, category_name: (p.categories as any)?.name ?? null }
  })

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/brand/${params.slug}`

  // WhatsApp helper
  const waHref = supplier.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi, I found your store on TTAI and I'd like to inquire about your products.`
    : null

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ══ HERO BANNER ══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes brandKenBurns { from { transform: scale(1) translateY(0); } to { transform: scale(1.09) translateY(-1.5%); } }
        .brand-kenburns { animation: brandKenBurns 22s ease-in-out infinite alternate; will-change: transform; }
        @keyframes brandHeroIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .brand-hero-in { animation: brandHeroIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
      <div className="relative h-80 sm:h-[440px] overflow-hidden">
        {supplier.banner_image ? (
          <Image src={supplier.banner_image} alt="" fill className="object-cover brand-kenburns" sizes="100vw" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F4D] via-[#1a3a7a] to-[#0d2d5e] brand-kenburns" />
        )}
        {/* Gradient — stronger at bottom for text, lighter at top */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(5,15,40,0.92) 0%, rgba(5,15,40,0.55) 45%, rgba(5,15,40,0.12) 100%)'
        }} />
        {/* Subtle top sheen */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Featured badge */}
        {supplier.is_featured && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#F5A623] text-[#0B1F4D] px-3 py-1.5 rounded-full text-xs font-extrabold shadow-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Supplier
          </div>
        )}

        {/* Hero content — bottom of cover */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 brand-hero-in">
          <div className="max-w-6xl mx-auto flex items-end justify-between gap-5">

            {/* Left: logo + name + tagline + badges */}
            <div className="flex items-end gap-4 flex-1 min-w-0">
              {/* Logo */}
              <div className="flex-shrink-0 relative mb-1">
                <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl border-[3px] border-white/80 shadow-2xl overflow-hidden bg-white">
                  <BrandLogo
                    src={supplier.logo_url}
                    name={supplier.trade_name ?? supplier.legal_name ?? 'S'}
                    size={88}
                    textClass="text-3xl"
                  />
                </div>
                {supplier.reliability_tier !== 'UNVERIFIED' && (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${tier.dot} border-2 border-white flex items-center justify-center`}>
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="pb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-[32px] font-extrabold text-white leading-none drop-shadow">
                    {supplier.trade_name ?? supplier.legal_name}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${tier.bg} ${tier.text} shadow-md whitespace-nowrap`}>
                    <tier.Icon className="w-3 h-3" />{tier.label}
                  </span>
                </div>
                {supplier.tagline && (
                  <p className="text-white/75 text-sm sm:text-[15px] leading-snug mb-2 line-clamp-1">{supplier.tagline}</p>
                )}
                {/* Inline meta: stars · location · badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {reviews.length > 0 && <StarRating rating={avgRating} count={reviews.length} />}
                  {(city || country) && (
                    <span className="flex items-center gap-1 text-white/60 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {city ? `${city.name}, ` : ''}{country?.name}
                    </span>
                  )}
                  {badges.slice(0, 3).map((b: string) => (
                    <span key={b} className="hidden sm:inline-flex items-center gap-1 bg-white/15 border border-white/25 text-white/85 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      <svg className="w-2.5 h-2.5 text-[#F5A623] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: CTA buttons — desktop only */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 mb-1">
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-bold backdrop-blur-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
              )}
              {supplier.business_email && (
                <a href={`mailto:${supplier.business_email}`}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-bold backdrop-blur-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ══ COMPACT STATS + NAV ANCHOR (sticky) ══════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-12 flex items-center justify-between gap-4 overflow-hidden">
          {/* Animated stats bar */}
          <StatsBar
            yearsExp={supplier.years_experience}
            productCount={products.length}
            employeeCount={supplier.employee_count}
            countriesServed={supplier.countries_served}
          />
          {/* Mobile-only quick CTAs */}
          <div className="flex gap-2 sm:hidden flex-shrink-0">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat
              </a>
            )}
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`}
                className="flex items-center gap-1.5 bg-[#0B1F4D] text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
            )}
          </div>
        </div>
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
        />
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
