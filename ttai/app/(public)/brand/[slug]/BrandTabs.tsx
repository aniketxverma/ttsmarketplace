'use client'

import { useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Images, Award, Star, MapPin, MessageCircle, Info,
  Store, Warehouse, Truck, Building2, ShoppingBag, Briefcase, Anchor,
  ChevronLeft, ChevronRight, Globe, Phone, Mail, Clock, Navigation,
  ExternalLink, Download, Play, X, BadgeCheck, Check, Reply,
  Share2, Calendar, Users
} from 'lucide-react'
import { formatCents } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Supplier {
  id: string; trade_name: string | null; legal_name: string | null
  brand_slug: string | null; description: string | null; about_company: string | null
  founded_year: number | null; website: string | null; phone: string | null
  whatsapp: string | null; business_email: string | null; working_hours: string | null
  google_map_link: string | null; instagram: string | null; facebook: string | null
  linkedin: string | null; twitter: string | null; youtube: string | null
  address_line1: string | null; address_line2: string | null; postal_code: string | null
  years_experience: number | null; employee_count: number | null; countries_served: number | null
  countries?: { name: string; iso_code: string } | null; cities?: { name: string } | null
}
interface Product {
  id: string; name: string; slug: string; price_cents: number; currency_code: string
  min_order_qty: number | null; thumb: string | null; category_name: string | null; description?: string | null
}
interface GalleryItem { id: string; url: string; type: 'image'|'video'; caption: string | null; sort_order: number }
interface Certification { id: string; title: string; issuer: string | null; issued_date: string | null; expiry_date: string | null; image_url: string | null }
interface Review { id: string; rating: number; comment: string | null; verified_purchase: boolean; supplier_reply: string | null; created_at: string; profiles: { full_name: string | null } | null }
interface Document { id: string; doc_type: string; file_url: string; uploaded_at: string }
interface Props {
  supplier: Supplier; products: Product[]; gallery: GalleryItem[]; certifications: Certification[]
  reviews: Review[]; documents: Document[]; avgRating: number; sectionVisibility: Record<string, boolean>
  pos: any[]; brandSlug: string; shareUrl?: string; badges: string[]
}

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WaIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Section label (spec pattern: small uppercase + amber underline) ────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: '#9B9892' }}>{children}</p>
      <div className="w-8 h-0.5 rounded-full" style={{ background: '#C8860A' }} />
    </div>
  )
}

// ── Star rating ───────────────────────────────────────────────────────────────
function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm'|'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-[#C8860A]' : 'text-[#E2E0DA]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── Product card (spec: 260px, 1:1 image, MOQ badge, hover reveal buttons) ────
function ProductCard({ product, wa }: { product: Product; wa: string | null }) {
  return (
    <div className="group bg-white border border-[#E2E0DA] rounded-lg overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)', transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1),box-shadow 250ms ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.cssText += ';transform:translateY(-4px);box-shadow:0 6px 20px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)' }}>

      {/* Image area */}
      <div className="relative aspect-square overflow-hidden" style={{ background: '#F2F1EE' }}>
        {product.thumb ? (
          <Image src={product.thumb} alt={product.name} fill className="object-cover"
            style={{ transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)' }}
            sizes="260px"
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12" style={{ color: '#C8C5BE' }} />
          </div>
        )}
        {/* MOQ badge */}
        {product.min_order_qty && (
          <div className="absolute bottom-2.5 left-2.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: '#0F1F3D' }}>
            MOQ {product.min_order_qty}
          </div>
        )}
        {/* Hover CTA overlay */}
        {wa && (
          <div className="absolute inset-0 bg-[#0F1F3D]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end p-3 gap-2">
            <a href={`${wa}?text=Hi! I'd like to request a sample of: ${product.name}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-colors hover:opacity-90"
              style={{ background: 'white', color: '#0F1F3D' }}>
              Sample
            </a>
            <a href={`${wa}?text=Hi! I'm interested in: ${product.name}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-colors hover:opacity-90"
              style={{ background: '#C8860A', color: '#0F1F3D' }}>
              Enquire
            </a>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {product.category_name && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: '#9B9892' }}>
            {product.category_name}
          </p>
        )}
        <h3 className="text-[15px] font-medium leading-snug line-clamp-2 mb-3" style={{ color: '#111110' }}>
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          {product.price_cents > 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-mono, monospace)', color: '#C8860A' }}>
                {formatCents(product.price_cents, product.currency_code)}
              </span>
              <span className="text-[11px]" style={{ color: '#9B9892' }}>/unit</span>
            </div>
          ) : (
            <span className="text-[13px] italic" style={{ color: '#9B9892' }}>Price on request</span>
          )}
          <span className="text-[11px] font-medium px-2 py-0.5 rounded flex-shrink-0" style={{ background: '#F2F1EE', color: '#5C5A56' }}>
            Wholesale
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Category slider (CSS scroll-snap + JS scrollBy arrows) ────────────────────
function CategorySlider({ name, products, wa }: { name: string; products: Product[]; wa: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left'|'right') => ref.current?.scrollBy({ left: dir === 'right' ? 276 : -276, behavior: 'smooth' })
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display,"Playfair Display",Georgia,serif)', fontSize: '20px', color: '#111110' }}>
            {name}
          </h3>
          <span className="text-[12px] px-2 py-0.5 rounded border" style={{ color: '#9B9892', borderColor: '#E2E0DA', background: '#F2F1EE' }}>
            {products.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium hidden sm:inline" style={{ color: '#C8860A' }}>
            View all {products.length} →
          </span>
          <button onClick={() => scroll('left')} className="w-8 h-8 flex items-center justify-center rounded border transition-colors hover:opacity-80"
            style={{ border: '1px solid #E2E0DA', background: 'white' }}>
            <ChevronLeft className="w-4 h-4" style={{ color: '#5C5A56' }} />
          </button>
          <button onClick={() => scroll('right')} className="w-8 h-8 flex items-center justify-center rounded border transition-colors hover:opacity-80"
            style={{ border: '1px solid #E2E0DA', background: 'white' }}>
            <ChevronRight className="w-4 h-4" style={{ color: '#5C5A56' }} />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any }}>
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
        {products.map(p => (
          <div key={p.id} className="flex-shrink-0 w-[220px] sm:w-[260px]" style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={p} wa={wa} />
          </div>
        ))}
        {/* Partial peek item indicator */}
        <div className="flex-shrink-0 w-4" />
      </div>
    </div>
  )
}

// ── POS types ─────────────────────────────────────────────────────────────────
const POS_TYPES: Record<string, { label: string; color: string; bg: string; Icon: React.ComponentType<{className?: string}> }> = {
  shop:         { label: 'Retail Shop',  color: '#1D4ED8', bg: '#EFF6FF', Icon: Store },
  warehouse:    { label: 'Warehouse',    color: '#374151', bg: '#F9FAFB', Icon: Warehouse },
  distributor:  { label: 'Distributor',  color: '#92400E', bg: '#FFFBEB', Icon: Truck },
  pickup_point: { label: 'Pickup',       color: '#065F46', bg: '#F0FDF4', Icon: Package },
  franchise:    { label: 'Franchise',    color: '#5B21B6', bg: '#F5F3FF', Icon: Building2 },
  client_store: { label: 'Client Store', color: '#0E7490', bg: '#ECFEFF', Icon: ShoppingBag },
  agent_office: { label: 'Agent Office', color: '#1D4ED8', bg: '#EFF6FF', Icon: Briefcase },
  export_hub:   { label: 'Export Hub',   color: '#065F46', bg: '#F0FDF4', Icon: Anchor },
}

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-[13px] font-medium transition-colors"
      style={{ color: copied ? '#1A7A4A' : '#5C5A56' }}>
      {copied ? <><Check className="w-4 h-4" />Copied</> : <><Share2 className="w-4 h-4" />Share</>}
    </button>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ supplier, certifications, shareUrl, wa }: {
  supplier: Supplier; certifications: Certification[]; shareUrl?: string; wa: string | null
}) {
  const country = supplier.countries as any as { name: string } | null
  const city    = supplier.cities   as any as { name: string } | null

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky space-y-4" style={{ top: '100px' }}>

        {/* Quick Contact */}
        <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          <SectionLabel>Get in Touch</SectionLabel>
          <div className="space-y-3.5 mb-5">
            {supplier.business_email && (
              <a href={`mailto:${supplier.business_email}`} className="flex items-start gap-3 group">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#0F1F3D' }} />
                <div>
                  <p className="text-[12px]" style={{ color: '#9B9892' }}>Email</p>
                  <p className="text-[14px] font-medium group-hover:underline truncate" style={{ color: '#111110' }}>{supplier.business_email}</p>
                </div>
              </a>
            )}
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`} className="flex items-start gap-3 group">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#0F1F3D' }} />
                <div>
                  <p className="text-[12px]" style={{ color: '#9B9892' }}>Phone</p>
                  <p className="text-[14px] font-medium group-hover:underline" style={{ color: '#111110' }}>{supplier.phone}</p>
                </div>
              </a>
            )}
            {wa && (
              <a href={`${wa}?text=Hi! I'd like to learn more about your products.`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <WaIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#0F1F3D' }} />
                <div>
                  <p className="text-[12px]" style={{ color: '#9B9892' }}>WhatsApp</p>
                  <p className="text-[14px] font-medium" style={{ color: '#1A7A4A' }}>Start Chat →</p>
                </div>
              </a>
            )}
            {supplier.website && (
              <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <Globe className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#0F1F3D' }} />
                <div>
                  <p className="text-[12px]" style={{ color: '#9B9892' }}>Website</p>
                  <p className="text-[14px] font-medium group-hover:underline truncate" style={{ color: '#0F1F3D' }}>
                    {supplier.website.replace(/^https?:\/\//, '')}
                  </p>
                </div>
              </a>
            )}
          </div>
          <div style={{ borderTop: '1px solid #E2E0DA', paddingTop: '16px' }}>
            <a href={wa ? `${wa}?text=Hello, I'd like to send an inquiry.` : `mailto:${supplier.business_email}`}
              target={wa ? '_blank' : undefined} rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#0F1F3D' }}>
              Send Inquiry
            </a>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          <SectionLabel>Company Info</SectionLabel>
          <div className="space-y-2.5">
            {[
              { label: 'Founded',     value: supplier.founded_year?.toString() },
              { label: 'Employees',   value: supplier.employee_count ? `${supplier.employee_count}+` : null },
              { label: 'Experience',  value: supplier.years_experience ? `${supplier.years_experience}+ years` : null },
              { label: 'Markets',     value: supplier.countries_served ? `${supplier.countries_served}+ countries` : null },
              { label: 'Location',    value: city ? `${(city as any).name}, ${(country as any)?.name ?? ''}` : country ? (country as any).name : null },
            ].filter(r => r.value).map(r => (
              <div key={r.label} className="flex justify-between items-baseline gap-3">
                <span className="text-[12px] flex-shrink-0" style={{ color: '#9B9892' }}>{r.label}</span>
                <span className="text-[13px] font-medium text-right" style={{ color: '#111110' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications compact */}
        {certifications.length > 0 && (
          <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <SectionLabel>Certifications</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {certifications.slice(0, 6).map(cert => {
                const valid = cert.expiry_date ? new Date(cert.expiry_date) > new Date() : true
                return (
                  <span key={cert.id} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-full"
                    style={{ background: valid ? '#E6F5EE' : '#FEF2F2', color: valid ? '#1A7A4A' : '#B91C1C', border: '1px solid #E2E0DA' }}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={valid ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                    </svg>
                    {cert.title}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Share */}
        {shareUrl && (
          <div className="flex items-center justify-between bg-white rounded-lg px-5 py-4" style={{ border: '1px solid #E2E0DA' }}>
            <span className="text-[13px]" style={{ color: '#5C5A56' }}>Share this profile</span>
            <ShareButton url={shareUrl} />
          </div>
        )}

      </div>
    </aside>
  )
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TAB_LIST = [
  { id: 'overview',       label: 'Overview' },
  { id: 'products',       label: 'Products' },
  { id: 'gallery',        label: 'Gallery' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'reviews',        label: 'Reviews' },
  { id: 'locations',      label: 'Locations' },
  { id: 'contact',        label: 'Contact' },
]

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function BrandTabs({
  supplier, products, gallery, certifications, reviews, documents,
  avgRating, sectionVisibility, pos, brandSlug, shareUrl, badges
}: Props) {
  const [tab, setTab] = useState('overview')
  const [activeCat, setActiveCat] = useState<string|null>(null)
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  const wa = supplier.whatsapp ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}` : null

  // Group products by category
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>()
    products.forEach(p => {
      const cat = p.category_name ?? 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    })
    return Array.from(map.entries()) // [['Olive Oil', [...]], ...]
  }, [products])

  const allCategories = productsByCategory.map(([cat]) => cat)
  const filteredCategories = activeCat ? productsByCategory.filter(([c]) => c === activeCat) : productsByCategory

  // Visible tabs
  const visibleTabs = TAB_LIST.filter(t => {
    if (t.id === 'products'       && products.length === 0) return false
    if (t.id === 'gallery'        && (gallery.length === 0 || sectionVisibility.gallery === false)) return false
    if (t.id === 'certifications' && certifications.length === 0 && documents.length === 0) return false
    if (t.id === 'reviews'        && sectionVisibility.reviews === false) return false
    if (t.id === 'locations'      && pos.length === 0) return false
    return true
  })

  const country = supplier.countries as any as { name: string } | null
  const city    = supplier.cities   as any as { name: string } | null

  return (
    <>
      {/* ── STICKY TAB NAV ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white" style={{ borderBottom: '1px solid #E2E0DA' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center h-12 min-w-max">
              {visibleTabs.map(t => {
                const isActive = tab === t.id
                const count = t.id === 'products' ? products.length : t.id === 'reviews' ? reviews.length : t.id === 'locations' ? pos.length : 0
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 px-4 sm:px-5 h-full text-sm font-medium transition-colors whitespace-nowrap"
                    style={{
                      color: isActive ? '#111110' : '#5C5A56',
                      borderBottom: `2px solid ${isActive ? '#0F1F3D' : 'transparent'}`,
                      fontFamily: 'var(--font-body, system-ui)',
                    }}>
                    {t.label}
                    {count > 0 && (
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: isActive ? '#0F1F3D' : '#F2F1EE', color: isActive ? 'white' : '#9B9892' }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT + SIDEBAR ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex gap-8 pb-28 sm:pb-12">

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              {/* Stats bar */}
              {(products.length > 0 || pos.length > 0 || supplier.years_experience || supplier.countries_served) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Products',        value: products.length,                  show: products.length > 0 },
                    { label: 'Points of Sale',   value: pos.length,                       show: pos.length > 0 },
                    { label: 'Yrs Active',        value: supplier.years_experience ? `${supplier.years_experience}+` : null, show: !!supplier.years_experience },
                    { label: 'Countries Served', value: supplier.countries_served ? `${supplier.countries_served}+` : null, show: !!supplier.countries_served },
                  ].filter(s => s.show).map(s => (
                    <div key={s.label} className="bg-white border rounded-lg px-6 py-5"
                      style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                      <p className="text-[28px] font-bold leading-none" style={{ fontFamily: 'var(--font-display,"Playfair Display",Georgia,serif)', color: '#0F1F3D' }}>
                        {s.value}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-[0.06em] mt-2" style={{ color: '#9B9892' }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* About */}
              {(supplier.about_company || supplier.description) && (
                <div className="bg-white border rounded-lg p-6 sm:p-8" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                  <SectionLabel>About</SectionLabel>
                  <p className="leading-relaxed whitespace-pre-line" style={{ color: '#5C5A56', fontSize: '15px', lineHeight: '1.7', maxWidth: '640px' }}>
                    {supplier.about_company ?? supplier.description}
                  </p>

                  {/* Social links */}
                  {[supplier.instagram, supplier.linkedin, supplier.facebook, supplier.youtube].some(Boolean) && (
                    <div className="flex flex-wrap gap-4 mt-6 pt-6" style={{ borderTop: '1px solid #E2E0DA' }}>
                      {[
                        { url: supplier.instagram, label: 'Instagram', color: '#E1306C' },
                        { url: supplier.linkedin,  label: 'LinkedIn',  color: '#0077B5' },
                        { url: supplier.facebook,  label: 'Facebook',  color: '#1877F2' },
                        { url: supplier.youtube,   label: 'YouTube',   color: '#FF0000' },
                      ].filter(s => s.url).map(s => (
                        <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium transition-opacity hover:opacity-70"
                          style={{ color: s.color }}>
                          {s.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Certifications row */}
              {certifications.length > 0 && (
                <div>
                  <SectionLabel>Certifications & Standards</SectionLabel>
                  <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {certifications.map(cert => {
                      const valid = cert.expiry_date ? new Date(cert.expiry_date) > new Date() : true
                      return (
                        <div key={cert.id} className="flex-shrink-0 w-36 bg-white border rounded-lg p-4 relative hover:shadow-md transition-shadow"
                          style={{ border: '1px solid #E2E0DA' }}>
                          {/* Verified check top-right */}
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: valid ? '#E6F5EE' : '#FEF2F2' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              style={{ color: valid ? '#1A7A4A' : '#B91C1C' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d={valid ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                            </svg>
                          </div>
                          {cert.image_url ? (
                            <div className="relative w-12 h-12 mb-3">
                              <Image src={cert.image_url} alt={cert.title} fill className="object-contain" sizes="48px" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 mb-3 rounded flex items-center justify-center" style={{ background: '#F2F1EE' }}>
                              <Award className="w-6 h-6" style={{ color: '#C8860A' }} />
                            </div>
                          )}
                          <p className="text-[13px] font-semibold leading-snug" style={{ color: '#111110' }}>{cert.title}</p>
                          {cert.issuer && <p className="text-[11px] mt-1" style={{ color: '#9B9892' }}>{cert.issuer}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Promo / CTA banner */}
              {wa && products.length > 0 && (
                <div className="rounded-lg overflow-hidden" style={{ background: '#0F1F3D' }}>
                  <div className="px-8 py-8 sm:py-10">
                    <p className="text-[22px] font-bold text-white mb-2"
                      style={{ fontFamily: 'var(--font-display,"Playfair Display",Georgia,serif)' }}>
                      Looking for wholesale prices?
                    </p>
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Request our full product catalogue with pricing and MOQ details.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a href={`${wa}?text=Hi! I'd like to request your full catalogue and wholesale pricing.`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ background: '#C8860A', color: '#0F1F3D' }}>
                        <WaIcon className="w-4 h-4" />Request Catalogue
                      </a>
                      <button onClick={() => setTab('products')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}>
                        Browse Products →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTS ──────────────────────────────────────────────── */}
          {tab === 'products' && (
            <div className="space-y-10">
              {/* Category filter pills */}
              {allCategories.length > 1 && (
                <div className="sticky top-12 z-30 py-3" style={{ background: '#F8F7F4', borderBottom: '1px solid #E2E0DA' }}>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    <button onClick={() => setActiveCat(null)}
                      className="flex-shrink-0 px-4 h-8 rounded-full text-[13px] font-medium transition-colors"
                      style={{
                        background: activeCat === null ? '#0F1F3D' : 'white',
                        color: activeCat === null ? 'white' : '#5C5A56',
                        border: `1px solid ${activeCat === null ? '#0F1F3D' : '#E2E0DA'}`,
                      }}>
                      All
                    </button>
                    {allCategories.map(cat => (
                      <button key={cat} onClick={() => setActiveCat(activeCat === cat ? null : cat)}
                        className="flex-shrink-0 px-4 h-8 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap"
                        style={{
                          background: activeCat === cat ? '#0F1F3D' : 'white',
                          color: activeCat === cat ? 'white' : '#5C5A56',
                          border: `1px solid ${activeCat === cat ? '#0F1F3D' : '#E2E0DA'}`,
                        }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category sliders */}
              {filteredCategories.map(([cat, prods]) => (
                <CategorySlider key={cat} name={cat} products={prods} wa={wa} />
              ))}

              {/* Catalogue download CTA */}
              {wa && (
                <div className="flex items-center gap-4 rounded-lg px-6 py-4"
                  style={{ background: '#F2F1EE', border: '1px solid #E2E0DA' }}>
                  <div className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ background: '#0F1F3D' }}>
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold" style={{ color: '#111110' }}>Product Catalogue</p>
                    <p className="text-[12px]" style={{ color: '#9B9892' }}>Request the full PDF catalogue with all products and pricing</p>
                  </div>
                  <a href={`${wa}?text=Hi! I'd like to request your product catalogue PDF.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ border: '1.5px solid #C8860A', color: '#C8860A', background: 'white' }}>
                    Download Catalogue
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── GALLERY ───────────────────────────────────────────────── */}
          {tab === 'gallery' && gallery.length > 0 && (
            <div>
              <SectionLabel>Photo & Video Gallery</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setLightbox(gallery[0])}
                  className="col-span-3 sm:col-span-2 row-span-2 group relative aspect-video sm:aspect-auto sm:h-72 rounded-lg overflow-hidden bg-[#F2F1EE] hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid #E2E0DA' }}>
                  {gallery[0].type === 'video'
                    ? <div className="w-full h-full bg-[#0F1F3D] flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                    : <Image src={gallery[0].url} alt={gallery[0].caption ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 100vw, 66vw" />
                  }
                </button>
                {gallery.slice(1).map(item => (
                  <button key={item.id} onClick={() => setLightbox(item)}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-[#F2F1EE] hover:opacity-90 transition-opacity"
                    style={{ border: '1px solid #E2E0DA' }}>
                    {item.type === 'video'
                      ? <div className="w-full h-full bg-[#0F1F3D] flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      : <Image src={item.url} alt={item.caption ?? ''} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="33vw" />
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CERTIFICATIONS ────────────────────────────────────────── */}
          {tab === 'certifications' && (
            <div className="space-y-8">
              {certifications.length > 0 && (
                <div>
                  <SectionLabel>Certifications & Standards</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certifications.map(cert => {
                      const valid = cert.expiry_date ? new Date(cert.expiry_date) > new Date() : true
                      return (
                        <div key={cert.id} className="flex gap-4 bg-white rounded-lg p-5 hover:shadow-md transition-shadow"
                          style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                          {cert.image_url ? (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-[#E2E0DA]">
                              <Image src={cert.image_url} alt={cert.title} fill className="object-contain p-1.5" sizes="64px" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg flex items-center justify-center"
                              style={{ background: '#FDF3DC' }}>
                              <Award className="w-8 h-8" style={{ color: '#C8860A' }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug" style={{ color: '#111110' }}>{cert.title}</p>
                            {cert.issuer && <p className="text-xs mt-0.5" style={{ color: '#9B9892' }}>{cert.issuer}</p>}
                            {cert.expiry_date && (
                              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: valid ? '#E6F5EE' : '#FEF2F2', color: valid ? '#1A7A4A' : '#B91C1C' }}>
                                {valid ? '✓ Valid' : '✗ Expired'} · {new Date(cert.expiry_date).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {documents.length > 0 && (
                <div>
                  <SectionLabel>Documents</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow group"
                        style={{ border: '1px solid #E2E0DA' }}>
                        <div className="w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center"
                          style={{ background: '#FEF2F2' }}>
                          <svg className="w-5 h-5" fill="none" stroke="#B91C1C" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold capitalize" style={{ color: '#111110' }}>{doc.doc_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs" style={{ color: '#9B9892' }}>{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                        <Download className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-[#0F1F3D]" style={{ color: '#C8C5BE' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS ───────────────────────────────────────────────── */}
          {tab === 'reviews' && (
            <div>
              <SectionLabel>{reviews.length} Customer Reviews</SectionLabel>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Summary */}
                  <div className="lg:col-span-1">
                    <div className="rounded-lg p-6 text-white" style={{ background: '#0F1F3D' }}>
                      <p className="text-6xl font-black text-center"
                        style={{ fontFamily: 'var(--font-display,"Playfair Display",Georgia,serif)' }}>
                        {avgRating.toFixed(1)}
                      </p>
                      <div className="flex justify-center mt-2"><Stars rating={avgRating} size="lg" /></div>
                      <p className="text-center text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                      </p>
                      <div className="mt-6 space-y-2">
                        {[5,4,3,2,1].map(star => {
                          const count = reviews.filter(r => r.rating === star).length
                          return (
                            <div key={star} className="flex items-center gap-2.5">
                              <span className="text-xs w-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{star}</span>
                              <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <div className="h-1.5 rounded-full" style={{ background: '#C8860A', width: reviews.length ? `${(count/reviews.length)*100}%` : '0%', transition: 'width 400ms ease' }} />
                              </div>
                              <span className="text-xs w-3 text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Cards */}
                  <div className="lg:col-span-2 space-y-4">
                    {reviews.map((r, i) => {
                      const name = (r.profiles as any)?.full_name ?? 'Anonymous'
                      const initials = name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()
                      const colors = ['#1D4ED8','#5B21B6','#065F46','#B45309','#BE185D','#0E7490']
                      return (
                        <div key={r.id} className="bg-white rounded-lg p-5" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                              style={{ background: colors[i % colors.length] }}>
                              {initials}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: '#111110' }}>{name}</p>
                                  <Stars rating={r.rating} />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {r.verified_purchase && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                      style={{ background: '#E6F5EE', color: '#1A7A4A' }}>
                                      <Check className="w-3 h-3" />Verified
                                    </span>
                                  )}
                                  <p className="text-xs" style={{ color: '#9B9892' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {r.comment && <p className="text-sm leading-relaxed" style={{ color: '#5C5A56' }}>{r.comment}</p>}
                              {r.supplier_reply && (
                                <div className="mt-3 rounded-lg p-3.5" style={{ background: '#F8F7F4', borderLeft: '3px solid #0F1F3D' }}>
                                  <p className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#0F1F3D' }}>
                                    <Reply className="w-3 h-3" />Supplier Reply
                                  </p>
                                  <p className="text-sm" style={{ color: '#5C5A56' }}>{r.supplier_reply}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg py-16 text-center" style={{ border: '1px dashed #C8C5BE', background: '#F2F1EE' }}>
                  <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C8C5BE' }} />
                  <p className="text-sm font-medium" style={{ color: '#9B9892' }}>No reviews yet</p>
                </div>
              )}
            </div>
          )}

          {/* ── LOCATIONS ─────────────────────────────────────────────── */}
          {tab === 'locations' && (
            <div>
              <SectionLabel>{pos.length} Location{pos.length !== 1 ? 's' : ''}</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pos.map((p: any) => {
                  const loc = p.pos_locations as any
                  const det = p.pos_details as any
                  const cfg = POS_TYPES[p.type] ?? { label: p.type, color: '#374151', bg: '#F9FAFB', Icon: MapPin }
                  const TypeIcon = cfg.Icon
                  const isOpen = p.status === 'active'
                  return (
                    <div key={p.id} className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5"
                        style={{ background: isOpen ? '#F0FDF4' : '#F9FAFB', borderBottom: '1px solid #E2E0DA' }}>
                        <div className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: isOpen ? '#065F46' : '#5C5A56' }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: isOpen ? '#1A7A4A' : '#9B9892' }} />
                          {isOpen ? 'Open' : 'Closed'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          <TypeIcon className="w-3 h-3" />{cfg.label}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold mb-1.5" style={{ color: '#111110', fontFamily: 'var(--font-display,"Playfair Display",Georgia,serif)', fontSize: '17px' }}>{p.name}</h3>
                        {(loc?.address_line1 || loc?.city) && (
                          <p className="text-sm flex items-start gap-1.5 mb-3" style={{ color: '#5C5A56' }}>
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#9B9892' }} />
                            {[loc.address_line1, loc.city, loc.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {det?.services_offered?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(det.services_offered as string[]).map((s: string) => (
                              <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{s}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid #E2E0DA' }}>
                          {det?.whatsapp && (
                            <a href={`https://wa.me/${det.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition-colors hover:opacity-90"
                              style={{ background: '#E6F5EE', color: '#1A7A4A' }}>
                              <WaIcon className="w-3.5 h-3.5" />WhatsApp
                            </a>
                          )}
                          <Link href={`/brand/${brandSlug}/pos/${p.id}`}
                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-semibold text-white transition-colors hover:opacity-90"
                            style={{ background: '#0F1F3D' }}>
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── CONTACT ───────────────────────────────────────────────── */}
          {tab === 'contact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Contact info */}
              <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <SectionLabel>Contact Details</SectionLabel>
                <div className="space-y-5">
                  {wa && (
                    <a href={`${wa}?text=Hi! I'd like to get in touch.`} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3.5 group">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: '#E6F5EE' }}>
                        <WaIcon className="w-5 h-5" style={{ color: '#1A7A4A' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#9B9892' }}>WhatsApp</p>
                        <p className="text-sm font-semibold group-hover:underline" style={{ color: '#1A7A4A' }}>{supplier.whatsapp}</p>
                      </div>
                    </a>
                  )}
                  {supplier.phone && (
                    <a href={`tel:${supplier.phone}`} className="flex items-start gap-3.5 group">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: '#EFF6FF' }}>
                        <Phone className="w-5 h-5" style={{ color: '#1D4ED8' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#9B9892' }}>Phone</p>
                        <p className="text-sm font-semibold group-hover:underline" style={{ color: '#111110' }}>{supplier.phone}</p>
                      </div>
                    </a>
                  )}
                  {supplier.business_email && (
                    <a href={`mailto:${supplier.business_email}`} className="flex items-start gap-3.5 group">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: '#F5F3FF' }}>
                        <Mail className="w-5 h-5" style={{ color: '#5B21B6' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#9B9892' }}>Email</p>
                        <p className="text-sm font-semibold group-hover:underline" style={{ color: '#111110' }}>{supplier.business_email}</p>
                      </div>
                    </a>
                  )}
                  {supplier.working_hours && (
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FFFBEB' }}>
                        <Clock className="w-5 h-5" style={{ color: '#B45309' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#9B9892' }}>Working Hours</p>
                        <p className="text-sm font-medium whitespace-pre-line leading-relaxed" style={{ color: '#111110' }}>{supplier.working_hours}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E2E0DA', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <SectionLabel>Address</SectionLabel>
                {(supplier.address_line1 || city || country) && (
                  <div className="flex items-start gap-3 mb-6">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#9B9892' }} />
                    <div className="text-sm leading-relaxed" style={{ color: '#5C5A56' }}>
                      {supplier.address_line1 && <p className="font-medium" style={{ color: '#111110' }}>{supplier.address_line1}</p>}
                      {supplier.address_line2 && <p>{supplier.address_line2}</p>}
                      <p>{city ? `${(city as any).name}, ` : ''}{country ? (country as any).name : ''} {supplier.postal_code ?? ''}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2.5">
                  {supplier.google_map_link && (
                    <a href={supplier.google_map_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: '#0F1F3D' }}>
                      <Navigation className="w-4 h-4" />Open in Google Maps
                    </a>
                  )}
                  {supplier.website && (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-80"
                      style={{ border: '1.5px solid #0F1F3D', color: '#0F1F3D' }}>
                      <ExternalLink className="w-4 h-4" />Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <Sidebar supplier={supplier} certifications={certifications} shareUrl={shareUrl} wa={wa} />

      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {lightbox.type === 'video'
                ? <video src={lightbox.url} controls className="w-full h-full" />
                : <Image src={lightbox.url} alt={lightbox.caption ?? ''} fill className="object-contain" sizes="100vw" />
              }
            </div>
            {lightbox.caption && <p className="text-center text-white/70 text-sm mt-4">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </>
  )
}
