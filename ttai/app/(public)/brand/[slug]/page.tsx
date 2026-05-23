import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { BrandTabs } from './BrandTabs'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: s } = await (supabase.from('suppliers') as any)
    .select('trade_name, tagline, seo_title, seo_description, seo_keywords, og_image, logo_url')
    .eq('brand_slug', params.slug)
    .eq('status', 'ACTIVE')
    .single() as { data: any }

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

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; glow: string }> = {
  GOLD:       { label: 'Gold Supplier',     bg: 'bg-gradient-to-r from-amber-400 to-yellow-300', text: 'text-amber-900', dot: 'bg-amber-500', glow: 'shadow-amber-200' },
  SILVER:     { label: 'Verified Supplier', bg: 'bg-gradient-to-r from-gray-300 to-slate-200',   text: 'text-gray-700',  dot: 'bg-gray-400',  glow: 'shadow-gray-200' },
  BRONZE:     { label: 'Bronze Supplier',   bg: 'bg-gradient-to-r from-orange-300 to-amber-200', text: 'text-orange-900', dot: 'bg-orange-500', glow: 'shadow-orange-200' },
  UNVERIFIED: { label: 'Supplier',          bg: 'bg-gray-100',  text: 'text-gray-500', dot: 'bg-gray-400', glow: '' },
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

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select(`
      id, trade_name, legal_name, brand_slug, tagline, logo_url, banner_image,
      description, about_company, founded_year, employee_count, years_experience,
      countries_served, website, phone, whatsapp, business_email, working_hours,
      google_map_link, instagram, facebook, linkedin, twitter, youtube,
      reliability_tier, status, is_featured, badges, section_visibility,
      address_line1, address_line2, postal_code,
      countries(name, iso_code), cities(name)
    `)
    .eq('brand_slug', params.slug)
    .eq('status', 'ACTIVE')
    .single() as { data: any }

  if (!supplier) notFound()

  const [productsRes, galleryRes, certsRes, reviewsRes, docsRes, posRes] = await Promise.all([
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
    (supabase.from('supplier_pos' as any) as any)
      .select('id, name, type, status, is_public, pos_locations(*), pos_details(phone, whatsapp, email, opening_hours, services_offered, accepts_walk_ins)')
      .eq('supplier_id', supplier.id)
      .eq('is_public', true)
      .order('sort_order', { ascending: true }),
  ])

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

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ══ HERO BANNER ══════════════════════════════════════════════════════ */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {supplier.banner_image ? (
          <Image src={supplier.banner_image} alt="" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F4D] via-[#1a3a7a] to-[#0d2d5e]" />
        )}
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Featured badge top-right */}
        {supplier.is_featured && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#F5A623] text-[#0B1F4D] px-3 py-1.5 rounded-full text-xs font-extrabold shadow-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Supplier
          </div>
        )}

        {/* Brand info overlaid at bottom of banner */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5 pt-16">
          <div className="max-w-6xl mx-auto flex items-end gap-5">
            {/* Logo */}
            <div className="flex-shrink-0 relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-white">
                {supplier.logo_url ? (
                  <Image src={supplier.logo_url} alt={supplier.trade_name ?? ''} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-[#0B1F4D] flex items-center justify-center">
                    <span className="text-white text-3xl font-extrabold">
                      {(supplier.trade_name ?? 'S')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Tier dot */}
              {supplier.reliability_tier !== 'UNVERIFIED' && (
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${tier.dot} border-2 border-white flex items-center justify-center`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name + tagline */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-sm">
                  {supplier.trade_name ?? supplier.legal_name}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.bg} ${tier.text} shadow`}>
                  {tier.label}
                </span>
              </div>
              {supplier.tagline && (
                <p className="text-white/80 text-sm sm:text-base line-clamp-2 leading-snug">{supplier.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {reviews.length > 0 && <StarRating rating={avgRating} count={reviews.length} />}
                {(city || country) && (
                  <span className="flex items-center gap-1 text-white/70 text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {city ? `${city.name}, ` : ''}{country?.name}
                  </span>
                )}
                {products.length > 0 && (
                  <span className="text-white/70 text-xs">{products.length} products</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ACTION BAR ═══════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 4).map((b: string) => (
              <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0B1F4D] text-xs font-semibold rounded-full border border-blue-100">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {b}
              </span>
            ))}
          </div>
          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            {supplier.whatsapp && (
              <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=Hi, I found your store on TTAI and I'd like to inquire about your products.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">Chat</span>
              </a>
            )}
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`}
                className="flex items-center gap-2 bg-[#0B1F4D] hover:bg-[#162d6e] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            {supplier.business_email && (
              <a href={`mailto:${supplier.business_email}`}
                className="flex items-center gap-2 border-2 border-[#0B1F4D] text-[#0B1F4D] hover:bg-[#0B1F4D] hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ══ STATS STRIP ══════════════════════════════════════════════════════ */}
      {(supplier.years_experience || supplier.employee_count || supplier.countries_served || supplier.founded_year) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {supplier.years_experience && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{supplier.years_experience}+</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Years Experience</p>
              </div>
            )}
            {products.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{products.length}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Products</p>
              </div>
            )}
            {supplier.employee_count && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{supplier.employee_count}+</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Employees</p>
              </div>
            )}
            {supplier.countries_served && supplier.countries_served > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{supplier.countries_served}+</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Countries Served</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT (TABS) ═══════════════════════════════════════════════ */}
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
