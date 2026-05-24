import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Crown, ShieldCheck, Award, Store, MapPin, Phone, Mail } from 'lucide-react'
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { BrandTabs } from './BrandTabs'

export const revalidate = 60

// ── Fonts ─────────────────────────────────────────────────────────────────────
const playfair = Playfair_Display({
  subsets: ['latin'], weight: ['400', '700'],
  variable: '--font-display', display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'], weight: ['300', '400', '500', '600'],
  variable: '--font-body', display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'], weight: ['400', '500'],
  variable: '--font-mono', display: 'swap',
})

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: s } = await (supabase.from('suppliers') as any)
    .select('trade_name, tagline, seo_title, seo_description, seo_keywords, og_image, logo_url')
    .eq('brand_slug', params.slug).eq('status', 'ACTIVE').single() as { data: any }
  if (!s) return {}
  return {
    title:       s.seo_title ?? `${s.trade_name} — Supplier Profile · TTAI`,
    description: s.seo_description ?? s.tagline ?? `Discover ${s.trade_name} wholesale products on TTAI`,
    keywords:    s.seo_keywords,
    openGraph: {
      title:       s.seo_title ?? s.trade_name,
      description: s.seo_description ?? s.tagline ?? '',
      images:      s.og_image ?? s.logo_url ? [{ url: s.og_image ?? s.logo_url! }] : [],
    },
  }
}

// ── Tier config ────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  pill: string   // Tailwind classes for the pill on the dark cover
  dot: string    // dot color on logo
}> = {
  GOLD:       { label: 'Gold Verified',    Icon: Crown,       pill: 'bg-[#FDF3DC] text-[#C8860A] border border-[#C8860A]', dot: '#C8860A' },
  SILVER:     { label: 'Verified',         Icon: ShieldCheck, pill: 'bg-white/15 text-white border border-white/40',       dot: '#1A7A4A' },
  BRONZE:     { label: 'Bronze Supplier',  Icon: Award,       pill: 'bg-white/15 text-white border border-white/40',       dot: '#92400E' },
  UNVERIFIED: { label: 'Supplier',         Icon: Store,       pill: 'bg-white/10 text-white/70 border border-white/25',    dot: '' },
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-[#C8860A]' : 'text-white/25'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-white/80">{rating.toFixed(1)}</span>
      <span className="text-sm text-white/50">({count})</span>
    </div>
  )
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
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
    .eq('brand_slug', params.slug).eq('status', 'ACTIVE').single() as { data: any }

  if (!supplier) notFound()

  const [productsRes, galleryRes, certsRes, reviewsRes, docsRes, posRes] = await Promise.all([
    supabase.from('products')
      .select('id, name, slug, price_cents, currency_code, min_order_qty, description, product_images(url, sort_order), categories(name)')
      .eq('supplier_id', supplier.id).eq('is_published', true)
      .order('created_at', { ascending: false }).limit(48),
    (supabase.from('brand_gallery' as any) as any)
      .select('id, url, type, caption, sort_order')
      .eq('supplier_id', supplier.id).order('sort_order', { ascending: true }),
    (supabase.from('brand_certifications' as any) as any)
      .select('id, title, issuer, issued_date, expiry_date, image_url').eq('supplier_id', supplier.id),
    (supabase.from('brand_reviews' as any) as any)
      .select('id, rating, comment, verified_purchase, supplier_reply, created_at, profiles(full_name)')
      .eq('supplier_id', supplier.id).order('created_at', { ascending: false }),
    supabase.from('supplier_documents').select('id, doc_type, file_url, uploaded_at').eq('supplier_id', supplier.id),
    (supabase.from('supplier_pos' as any) as any)
      .select('id, name, type, status, is_public, pos_locations(*), pos_details(phone, whatsapp, email, opening_hours, services_offered, accepts_walk_ins)')
      .eq('supplier_id', supplier.id).eq('is_public', true).order('sort_order', { ascending: true }),
  ])

  const reviews  = (reviewsRes.data ?? []) as any[]
  const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0
  const country   = supplier.countries as any as { name: string; iso_code: string } | null
  const city      = supplier.cities   as any as { name: string } | null
  const tier      = TIER_CONFIG[supplier.reliability_tier] ?? TIER_CONFIG.UNVERIFIED
  const sv        = (supplier.section_visibility ?? {}) as Record<string, boolean>
  const badges    = (supplier.badges ?? []) as string[]
  const displayName = supplier.trade_name ?? supplier.legal_name ?? 'Supplier'
  const posData   = (posRes.data ?? []) as any[]

  const products = (productsRes.data ?? []).map((p: any) => {
    const imgs = ((p.product_images ?? []) as { url: string; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order)
    return { ...p, thumb: imgs[0]?.url ?? null, category_name: (p.categories as any)?.name ?? null }
  })

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/brand/${params.slug}`

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable} min-h-screen`}
      style={{ backgroundColor: '#F8F7F4', fontFamily: 'var(--font-body, system-ui)' }}
    >

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <div>
        {/* Cover image */}
        <div className="h-[220px] sm:h-[360px] relative overflow-hidden bg-[#0F1F3D]">
          {supplier.banner_image && (
            <Image src={supplier.banner_image} alt="" fill className="object-cover" sizes="100vw" priority />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(15,31,61,0.94) 0%, rgba(15,31,61,0.55) 40%, rgba(15,31,61,0.15) 100%)'
          }} />

          {/* Featured pill */}
          {supplier.is_featured && (
            <div className="absolute top-4 right-4 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full"
              style={{ background: '#FDF3DC', border: '1px solid #C8860A', color: '#C8860A' }}>
              ★ Featured Supplier
            </div>
          )}

          {/* Hero content — bottom of cover */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5">
            <div className="max-w-6xl mx-auto flex items-end justify-between gap-4">

              {/* Company info — left, offset right of logo */}
              <div className="flex-1 pl-24 sm:pl-28">
                <h1 className="text-[26px] sm:text-[32px] font-bold text-white leading-tight drop-shadow-sm"
                  style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}>
                  {displayName}
                </h1>
                {supplier.tagline && (
                  <p className="mt-1 text-sm sm:text-[15px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {supplier.tagline}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-2 mt-3">
                  {/* Tier badge */}
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full ${tier.pill}`}>
                    <tier.Icon className="w-3 h-3" />{tier.label}
                  </span>
                  {/* Location */}
                  {country && (
                    <span className="flex items-center gap-1 text-[12px] text-white/60">
                      <MapPin className="w-3 h-3" />
                      {city ? `${city.name}, ` : ''}{country.name}
                    </span>
                  )}
                  {/* Category/badge pills */}
                  {badges.slice(0, 3).map(b => (
                    <span key={b} className="text-[12px] px-2.5 py-0.5 rounded-full text-white"
                      style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)' }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons — desktop only, in cover */}
              <div className="hidden sm:flex gap-2 flex-shrink-0">
                {supplier.whatsapp && (
                  <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi! I found your profile on TTAI and would like to inquire.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-md transition-opacity hover:opacity-90"
                    style={{ background: '#C8860A', color: '#0F1F3D' }}>
                    <WaIcon className="w-4 h-4" />WhatsApp
                  </a>
                )}
                {supplier.phone && (
                  <a href={`tel:${supplier.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-md text-white transition-colors hover:bg-white/20"
                    style={{ border: '1.5px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)' }}>
                    <Phone className="w-4 h-4" />Call
                  </a>
                )}
                {supplier.business_email && (
                  <a href={`mailto:${supplier.business_email}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-md text-white transition-colors hover:bg-white/20"
                    style={{ border: '1.5px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)' }}>
                    <Mail className="w-4 h-4" />Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-bar: logo overlaps here + ratings + mobile CTAs */}
        <div className="relative bg-white" style={{ borderBottom: '1px solid #E2E0DA' }}>
          {/* Logo — centered on the cover-subbar boundary */}
          <div className="absolute top-0 left-4 sm:left-8 z-10" style={{ transform: 'translateY(-50%)' }}>
            <div className="w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] rounded-lg overflow-hidden bg-white"
              style={{ border: '3px solid white', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
              {supplier.logo_url ? (
                <Image src={supplier.logo_url} alt={displayName} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0F1F3D]">
                  <span className="text-3xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}>{displayName[0]}</span>
                </div>
              )}
            </div>
            {/* Verified dot */}
            {tier.dot && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: tier.dot, border: '2px solid white' }}>
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Sub-bar content */}
          <div className="max-w-6xl mx-auto flex items-center justify-between py-2.5 px-4 sm:px-8 pl-[calc(1rem+80px+12px)] sm:pl-[calc(2rem+96px+16px)]">
            <div className="flex items-center gap-4 flex-wrap text-sm" style={{ color: '#5C5A56' }}>
              {reviews.length > 0 && <StarRating rating={avgRating} count={reviews.length} />}
              {products.length > 0 && <span>{products.length} products</span>}
              {posData.length > 0 && <span>{posData.length} location{posData.length !== 1 ? 's' : ''}</span>}
              {supplier.years_experience && <span>{supplier.years_experience}+ yrs experience</span>}
            </div>
            {/* Mobile action buttons */}
            <div className="flex gap-1.5 sm:hidden">
              {supplier.whatsapp && (
                <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md"
                  style={{ background: '#C8860A', color: '#0F1F3D' }}>
                  <WaIcon className="w-3.5 h-3.5" />Chat
                </a>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md text-white"
                  style={{ background: '#0F1F3D' }}>
                  <Phone className="w-3.5 h-3.5" />Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABS + CONTENT ══════════════════════════════════════════════════ */}
      <BrandTabs
        supplier={supplier as any}
        products={products}
        gallery={(galleryRes.data ?? []) as any[]}
        certifications={(certsRes.data ?? []) as any[]}
        reviews={reviews}
        documents={(docsRes.data ?? []) as any[]}
        avgRating={avgRating}
        sectionVisibility={sv}
        pos={posData}
        brandSlug={params.slug}
        shareUrl={shareUrl}
        badges={badges}
      />

      {/* ══ MOBILE STICKY CTA ═══════════════════════════════════════════════ */}
      {(supplier.whatsapp || supplier.phone) && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 flex gap-3"
          style={{ background: 'white', borderTop: '1px solid #E2E0DA', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          {supplier.whatsapp && (
            <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi, I'd like to inquire about your products.`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm"
              style={{ background: '#C8860A', color: '#0F1F3D' }}>
              <WaIcon className="w-5 h-5" />WhatsApp
            </a>
          )}
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white"
              style={{ background: '#0F1F3D' }}>
              <Phone className="w-5 h-5" />Call Now
            </a>
          )}
        </div>
      )}

    </div>
  )
}
