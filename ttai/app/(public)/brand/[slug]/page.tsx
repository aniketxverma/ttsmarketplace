import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCents } from '@/lib/utils'
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
    title:       s.seo_title       ?? `${s.trade_name} — Brand Profile · TTAI EMA`,
    description: s.seo_description ?? s.tagline ?? `Explore ${s.trade_name} products on TTAI EMA Marketplace`,
    keywords:    s.seo_keywords,
    openGraph: {
      title:       s.seo_title ?? s.trade_name,
      description: s.seo_description ?? s.tagline ?? '',
      images:      s.og_image ?? s.logo_url ? [{ url: s.og_image ?? s.logo_url! }] : [],
    },
  }
}

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  GOLD:       { label: 'Gold Supplier',     color: 'bg-amber-100 text-amber-700 border-amber-300' },
  SILVER:     { label: 'Verified Supplier', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  BRONZE:     { label: 'Bronze Supplier',   color: 'bg-orange-100 text-orange-700 border-orange-300' },
  UNVERIFIED: { label: 'Supplier',          color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
      {count > 0 && <span className="text-sm text-gray-400">({count} reviews)</span>}
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

  const [productsRes, galleryRes, certsRes, reviewsRes, docsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price_cents, currency_code, min_order_qty, product_images(url, sort_order), categories(name)')
      .eq('supplier_id', supplier.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase
      .from('brand_gallery' as any)
      .select('id, url, type, caption, sort_order')
      .eq('supplier_id', supplier.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('brand_certifications' as any)
      .select('id, title, issuer, issued_date, expiry_date, image_url')
      .eq('supplier_id', supplier.id),
    supabase
      .from('brand_reviews' as any)
      .select('id, rating, comment, verified_purchase, supplier_reply, created_at, profiles(full_name)')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('supplier_documents')
      .select('id, doc_type, file_url, uploaded_at')
      .eq('supplier_id', supplier.id),
  ])

  const reviews = (reviewsRes.data ?? []) as any[]
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const country = supplier.countries as any as { name: string; iso_code: string } | null
  const city    = supplier.cities   as any as { name: string } | null
  const tier    = TIER_BADGE[supplier.reliability_tier] ?? TIER_BADGE.UNVERIFIED
  const sv      = (supplier.section_visibility ?? {}) as Record<string, boolean>

  const products = (productsRes.data ?? []).map((p) => {
    const imgs = ((p.product_images ?? []) as { url: string; sort_order: number }[]).sort((a, b) => a.sort_order - b.sort_order)
    return { ...p, thumb: imgs[0]?.url ?? null, category_name: (p.categories as any)?.name ?? null }
  })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-56 sm:h-72 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] overflow-hidden">
          {supplier.banner_image && (
            <Image src={supplier.banner_image} alt="" fill className="object-cover opacity-60" sizes="100vw" priority />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {supplier.is_featured && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#F5A623] text-[#0B1F4D] px-3 py-1.5 rounded-full text-xs font-extrabold shadow-md">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </div>
          )}
        </div>

        {/* Profile card */}
        <div className="container mx-auto px-4 sm:px-8">
          <div className="relative -mt-16 sm:-mt-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-[#0B1F4D] flex items-center justify-center">
                  {supplier.logo_url ? (
                    <Image src={supplier.logo_url} alt={supplier.trade_name ?? ''} width={112} height={112} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-white text-3xl font-extrabold">
                      {(supplier.trade_name ?? 'S')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-3 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight">
                    {supplier.trade_name ?? supplier.legal_name}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tier.color}`}>
                    {supplier.reliability_tier === 'GOLD' || supplier.reliability_tier === 'SILVER' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                    {tier.label}
                  </span>
                </div>

                {supplier.tagline && (
                  <p className="text-gray-500 text-sm sm:text-base mb-3">{supplier.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {reviews.length > 0 && <StarRating rating={avgRating} count={reviews.length} />}
                  {products.length > 0 && (
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      {products.length} Products
                    </span>
                  )}
                  {country && (
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {city ? `${city.name}, ` : ''}{country.name}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2.5">
                  {supplier.whatsapp && (
                    <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-green-500 text-white px-4 py-2 text-sm font-bold hover:bg-green-600 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                  {supplier.phone && (
                    <a href={`tel:${supplier.phone}`}
                      className="flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-4 py-2 text-sm font-bold hover:bg-[#162d6e] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </a>
                  )}
                  {supplier.website && (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-4 py-2 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Website
                    </a>
                  )}
                  {supplier.business_email && (
                    <a href={`mailto:${supplier.business_email}`}
                      className="flex items-center gap-2 rounded-xl border-2 border-gray-200 text-gray-600 px-4 py-2 text-sm font-bold hover:border-gray-400 transition-colors">
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
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      {(supplier.years_experience || supplier.employee_count || supplier.countries_served || supplier.founded_year) && (
        <div className="container mx-auto px-4 sm:px-8 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {supplier.years_experience && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{supplier.years_experience}+</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Years Experience</p>
              </div>
            )}
            {products.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{products.length}+</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Products</p>
              </div>
            )}
            {supplier.employee_count && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{supplier.employee_count}+</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Employees</p>
              </div>
            )}
            {supplier.countries_served && supplier.countries_served > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-[#0B1F4D]">{supplier.countries_served}+</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Countries Served</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs + content ────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-8 mt-4 pb-16">
        <BrandTabs
          supplier={supplier as any}
          products={products}
          gallery={(galleryRes.data ?? []) as any[]}
          certifications={(certsRes.data ?? []) as any[]}
          reviews={reviews}
          documents={(docsRes.data ?? []) as any[]}
          avgRating={avgRating}
          sectionVisibility={sv}
        />
      </div>
    </div>
  )
}
