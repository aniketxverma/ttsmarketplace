'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Images, Award, Star, MapPin, MessageCircle, Info,
  Store, Warehouse, Truck, Building2, ShoppingBag, Briefcase, Anchor,
  Calendar, Globe, Share2, Check, Phone, Mail, Clock, Navigation,
  ExternalLink, Download, Play, X, BadgeCheck, ChevronRight, Tag,
  Reply, Users, Quote
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
  pos: any[]; brandSlug: string; shareUrl?: string
}

// ── WhatsApp icon (no lucide equivalent) ─────────────────────────────────────
function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Stars helper ──────────────────────────────────────────────────────────────
function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm'|'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({
  icon: Icon, title, subtitle, action
}: {
  icon: React.ComponentType<{className?: string}>
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0B1F4D] flex items-center justify-center shadow-md flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[#0B1F4D] leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
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
    <button onClick={copy}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all whitespace-nowrap ${
        copied ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-gray-600 hover:border-[#0B1F4D] hover:text-[#0B1F4D] bg-white'
      }`}>
      {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Share2 className="w-4 h-4" />Share</>}
    </button>
  )
}

// ── Section nav config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'about',          label: 'About',         Icon: Info },
  { id: 'products',       label: 'Products',       Icon: Package },
  { id: 'gallery',        label: 'Gallery',        Icon: Images },
  { id: 'certifications', label: 'Certifications', Icon: Award },
  { id: 'reviews',        label: 'Reviews',        Icon: Star },
  { id: 'locations',      label: 'Locations',      Icon: MapPin },
  { id: 'contact',        label: 'Contact',        Icon: MessageCircle },
]

// ── POS type config ────────────────────────────────────────────────────────────
const POS_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ComponentType<{className?: string}> }> = {
  shop:         { label: 'Retail Shop',  color: 'text-blue-700',   bg: 'bg-blue-50',   Icon: Store },
  warehouse:    { label: 'Warehouse',    color: 'text-gray-700',   bg: 'bg-gray-100',  Icon: Warehouse },
  distributor:  { label: 'Distributor',  color: 'text-amber-700',  bg: 'bg-amber-50',  Icon: Truck },
  pickup_point: { label: 'Pickup Point', color: 'text-green-700',  bg: 'bg-green-50',  Icon: Package },
  franchise:    { label: 'Franchise',    color: 'text-purple-700', bg: 'bg-purple-50', Icon: Building2 },
  client_store: { label: 'Client Store', color: 'text-pink-700',   bg: 'bg-pink-50',   Icon: ShoppingBag },
  agent_office: { label: 'Agent Office', color: 'text-indigo-700', bg: 'bg-indigo-50', Icon: Briefcase },
  export_hub:   { label: 'Export Hub',   color: 'text-teal-700',   bg: 'bg-teal-50',   Icon: Anchor },
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function BrandTabs({
  supplier, products, gallery, certifications, reviews, documents,
  avgRating, sectionVisibility, pos, brandSlug, shareUrl
}: Props) {
  const [activeSection, setActiveSection] = useState('about')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  const wa = supplier.whatsapp ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}` : null
  const country = supplier.countries as any as { name: string } | null
  const city    = supplier.cities   as any as { name: string } | null

  // Determine which sections to show in the nav
  const visibleNav = NAV_ITEMS.filter(item => {
    if (item.id === 'products'       && products.length === 0) return false
    if (item.id === 'gallery'        && (gallery.length === 0 || sectionVisibility.gallery === false)) return false
    if (item.id === 'certifications' && (certifications.length === 0 || sectionVisibility.certifications === false)) return false
    if (item.id === 'reviews'        && sectionVisibility.reviews === false) return false
    if (item.id === 'locations'      && pos.length === 0) return false
    return true
  })

  // Scrollspy — listen to scroll and update active section
  useEffect(() => {
    const onScroll = () => {
      const offset = 140 // sticky bars height
      for (let i = visibleNav.length - 1; i >= 0; i--) {
        const el = document.getElementById(`sec-${visibleNav[i].id}`)
        if (el && el.getBoundingClientRect().top <= offset) {
          setActiveSection(visibleNav[i].id)
          return
        }
      }
      setActiveSection(visibleNav[0]?.id ?? 'about')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [visibleNav])

  const scrollTo = (id: string) => {
    const el = document.getElementById(`sec-${id}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const avatarColors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-amber-500','bg-pink-500','bg-teal-500']

  return (
    <>
      {/* ── STICKY SECTION NAV ─────────────────────────────────────────────── */}
      <div className="sticky top-[52px] z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 sm:-mx-8 mb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="overflow-x-auto scrollbar-none flex-1">
            <div className="flex items-center min-w-max">
              {visibleNav.map(item => {
                const isActive = activeSection === item.id
                const NavIcon = item.Icon
                const count =
                  item.id === 'products' ? products.length :
                  item.id === 'reviews'  ? reviews.length  :
                  item.id === 'locations'? pos.length       :
                  item.id === 'gallery'  ? gallery.length   : 0
                return (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-[#0B1F4D] text-[#0B1F4D]'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}>
                    <NavIcon className={`w-4 h-4 ${isActive ? 'text-[#0B1F4D]' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          {shareUrl && (
            <div className="pl-3 flex-shrink-0 hidden sm:block">
              <ShareButton url={shareUrl} />
            </div>
          )}
        </div>
      </div>

      {/* ── PAGE SECTIONS ──────────────────────────────────────────────────── */}
      <div className="mt-10 space-y-20 pb-28 sm:pb-14">

        {/* ── ABOUT ────────────────────────────────────────────────────────── */}
        <section id="sec-about">
          <SectionHeading icon={Info} title="About the Company" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
              {(supplier.about_company || supplier.description) ? (
                <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                  {supplier.about_company ?? supplier.description}
                </p>
              ) : (
                <p className="text-gray-400 italic text-sm">No company description added yet.</p>
              )}

              {/* Social links */}
              {[supplier.instagram, supplier.linkedin, supplier.facebook, supplier.youtube].some(Boolean) && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                  {[
                    { url: supplier.instagram, label: 'Instagram', bg: 'bg-gradient-to-br from-pink-500 to-purple-600',
                      svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
                    { url: supplier.linkedin, label: 'LinkedIn', bg: 'bg-blue-700',
                      svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                    { url: supplier.facebook, label: 'Facebook', bg: 'bg-blue-600',
                      svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                    { url: supplier.youtube, label: 'YouTube', bg: 'bg-red-600',
                      svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                  ].filter(s => s.url).map(s => (
                    <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0B1F4D] transition-colors group">
                      <span className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {s.svg}
                      </span>
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick facts sidebar */}
            <div className="space-y-3">
              {supplier.founded_year && (
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Founded</p>
                    <p className="font-extrabold text-[#0B1F4D]">{supplier.founded_year}</p>
                  </div>
                </div>
              )}
              {(city || country) && (
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Location</p>
                    <p className="font-extrabold text-[#0B1F4D] text-sm">
                      {city ? `${(city as any).name}, ` : ''}{country ? (country as any).name : ''}
                    </p>
                  </div>
                </div>
              )}
              {supplier.website && (
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Website</p>
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                      className="font-extrabold text-[#0B1F4D] text-sm hover:underline truncate block">
                      {supplier.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
              {supplier.working_hours && (
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Hours</p>
                    <p className="font-semibold text-[#0B1F4D] text-sm whitespace-pre-line leading-snug">{supplier.working_hours}</p>
                  </div>
                </div>
              )}

              {/* WhatsApp inquiry CTA in sidebar */}
              {wa && (
                <a href={`${wa}?text=Hi! I found your store on TTAI and I'd like to know more.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-400 text-white py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm mt-2">
                  <WaIcon className="w-5 h-5" />Send a Message
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── PRODUCTS ─────────────────────────────────────────────────────── */}
        {products.length > 0 && (
          <section id="sec-products">
            <SectionHeading
              icon={Package}
              title="Our Products"
              subtitle={`${products.length} products available for wholesale`}
              action={wa ? (
                <a href={`${wa}?text=Hi! I'd like to request your full catalogue.`}
                  target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <WaIcon className="w-4 h-4" />Request Catalogue
                </a>
              ) : undefined}
            />

            {/* Featured hero product */}
            {products[0]?.thumb && (
              <div className="mb-6 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-xl">
                <div className="relative sm:w-72 h-52 sm:h-auto flex-shrink-0">
                  <Image src={products[0].thumb} alt={products[0].name} fill className="object-cover opacity-90" sizes="(max-width:640px) 100vw, 288px" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B1F4D]/60 hidden sm:block" />
                </div>
                <div className="p-7 flex flex-col justify-center gap-3">
                  {products[0].category_name && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#F5A623] uppercase tracking-widest">
                      <Tag className="w-3.5 h-3.5" />{products[0].category_name}
                    </span>
                  )}
                  <h3 className="text-2xl font-extrabold text-white leading-snug">{products[0].name}</h3>
                  {products[0].description && (
                    <p className="text-white/70 text-sm line-clamp-2 max-w-lg">{products[0].description}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-extrabold text-[#F5A623]">
                      {formatCents(products[0].price_cents, products[0].currency_code)}
                    </span>
                    {products[0].min_order_qty && (
                      <span className="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full">MOQ {products[0].min_order_qty}</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1">
                    {wa && (
                      <a href={`${wa}?text=Hi! I'm interested in: ${products[0].name}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                        <WaIcon className="w-4 h-4" />Inquire Now
                      </a>
                    )}
                    <Link href={`/marketplace/${products[0].id}`}
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                      View Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(products[0]?.thumb ? 1 : 0).map(p => (
                <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {p.thumb ? (
                      <Image src={p.thumb} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="w-10 h-10 text-gray-200" />
                      </div>
                    )}
                    {wa && (
                      <div className="absolute inset-0 bg-[#0B1F4D]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={`${wa}?text=Hi! I'm interested in: ${p.name}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-green-400 transition-colors">
                          <WaIcon className="w-4 h-4" />Inquire
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    {p.category_name && (
                      <p className="text-xs text-[#F5A623] font-bold mb-0.5 uppercase tracking-wide">{p.category_name}</p>
                    )}
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#0B1F4D]">{formatCents(p.price_cents, p.currency_code)}</span>
                      {p.min_order_qty && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">MOQ {p.min_order_qty}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Request quote CTA */}
            {wa && (
              <div className="mt-8 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div>
                  <p className="text-white font-extrabold text-xl">Need a custom quote?</p>
                  <p className="text-white/60 text-sm mt-1">Contact us directly for bulk pricing, catalogues or custom orders.</p>
                </div>
                <a href={`${wa}?text=Hi! I'd like to request a catalogue and pricing from your store.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 bg-[#F5A623] hover:bg-amber-400 text-[#0B1F4D] px-6 py-3.5 rounded-xl font-extrabold transition-colors shadow-lg whitespace-nowrap">
                  <WaIcon className="w-5 h-5" />Request Custom Quote
                </a>
              </div>
            )}
          </section>
        )}

        {/* ── GALLERY ──────────────────────────────────────────────────────── */}
        {gallery.length > 0 && sectionVisibility.gallery !== false && (
          <section id="sec-gallery">
            <SectionHeading icon={Images} title="Gallery" subtitle={`${gallery.length} photos & videos`} />
            <div className="grid grid-cols-3 gap-3">
              {/* Featured large */}
              <button onClick={() => setLightbox(gallery[0])}
                className="col-span-3 sm:col-span-2 row-span-2 group relative aspect-video sm:aspect-auto sm:h-80 rounded-2xl overflow-hidden bg-gray-100 hover:ring-4 hover:ring-[#F5A623] transition-all shadow-sm">
                {gallery[0].type === 'video'
                  ? <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                  : <Image src={gallery[0].url} alt={gallery[0].caption ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 100vw, 66vw" />
                }
                {gallery[0].caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm px-4 py-3 translate-y-full group-hover:translate-y-0 transition-transform font-medium">
                    {gallery[0].caption}
                  </div>
                )}
              </button>
              {gallery.slice(1).map(item => (
                <button key={item.id} onClick={() => setLightbox(item)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:ring-4 hover:ring-[#F5A623] transition-all shadow-sm">
                  {item.type === 'video'
                    ? <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    : <Image src={item.url} alt={item.caption ?? ''} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="33vw" />
                  }
                  {item.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform truncate">
                      {item.caption}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── CERTIFICATIONS ───────────────────────────────────────────────── */}
        {(certifications.length > 0 || documents.length > 0) && sectionVisibility.certifications !== false && (
          <section id="sec-certifications">
            <SectionHeading icon={Award} title="Certifications & Documents" subtitle="Quality assurance and compliance" />
            {certifications.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {certifications.map(cert => (
                  <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                    {cert.image_url ? (
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                        <Image src={cert.image_url} alt={cert.title} fill className="object-contain p-1.5" sizes="64px" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Award className="w-8 h-8 text-amber-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-snug">{cert.title}</p>
                      {cert.issuer && <p className="text-xs text-gray-400 mt-0.5">{cert.issuer}</p>}
                      {cert.expiry_date && (
                        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          new Date(cert.expiry_date) > new Date() ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}>
                          <BadgeCheck className="w-3 h-3" />
                          {new Date(cert.expiry_date) > new Date() ? 'Valid' : 'Expired'} · {new Date(cert.expiry_date).getFullYear()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {documents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-[#0B1F4D]/20 transition-all group">
                    <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-[#0B1F4D] transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
        {sectionVisibility.reviews !== false && (
          <section id="sec-reviews">
            <SectionHeading
              icon={Star}
              title="Customer Reviews"
              subtitle={reviews.length > 0 ? `${avgRating.toFixed(1)} average · ${reviews.length} reviews` : 'No reviews yet'}
            />
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] rounded-2xl p-6 text-white sticky top-[110px]">
                    <p className="text-6xl font-black text-center">{avgRating.toFixed(1)}</p>
                    <div className="flex justify-center mt-2"><Stars rating={avgRating} size="lg" /></div>
                    <p className="text-white/60 text-sm text-center mt-2">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                    <div className="mt-6 space-y-2">
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length
                        return (
                          <div key={star} className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-white/50 w-2">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                            <div className="flex-1 bg-white/10 rounded-full h-1.5">
                              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: reviews.length ? `${(count/reviews.length)*100}%` : '0%' }} />
                            </div>
                            <span className="text-xs text-white/40 w-3 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {/* Review cards */}
                <div className="lg:col-span-2 space-y-4">
                  {reviews.map((r, i) => {
                    const name = (r.profiles as any)?.full_name ?? 'Anonymous Buyer'
                    const color = ['bg-blue-500','bg-purple-500','bg-green-500','bg-amber-500','bg-pink-500','bg-teal-500'][i % 6]
                    const initials = name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()
                    return (
                      <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-white text-sm font-bold`}>
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{name}</p>
                                <Stars rating={r.rating} />
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {r.verified_purchase && (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />Verified
                                  </span>
                                )}
                                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                            {r.supplier_reply && (
                              <div className="mt-3 bg-blue-50 rounded-xl p-3.5 border-l-4 border-[#0B1F4D]">
                                <p className="text-xs font-bold text-[#0B1F4D] mb-1 flex items-center gap-1.5">
                                  <Reply className="w-3.5 h-3.5" />Supplier Reply
                                </p>
                                <p className="text-sm text-gray-600">{r.supplier_reply}</p>
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
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Star className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No reviews yet — be the first to review!</p>
              </div>
            )}
          </section>
        )}

        {/* ── LOCATIONS ────────────────────────────────────────────────────── */}
        {pos.length > 0 && (
          <section id="sec-locations">
            <SectionHeading icon={MapPin} title="Our Locations" subtitle={`${pos.length} ${pos.length === 1 ? 'location' : 'locations'} worldwide`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pos.map((p: any) => {
                const loc = p.pos_locations as any
                const det = p.pos_details as any
                const cfg = POS_TYPE_CONFIG[p.type] ?? { label: p.type, color: 'text-gray-700', bg: 'bg-gray-100', Icon: MapPin }
                const TypeIcon = cfg.Icon
                const isActive = p.status === 'active'
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`px-4 py-2.5 flex items-center justify-between ${isActive ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {isActive ? 'Open' : p.status.replace('_', ' ')}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />{cfg.label}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
                      {(loc?.address_line1 || loc?.city) && (
                        <p className="text-sm text-gray-500 flex items-start gap-1.5 mb-3">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                          {[loc.address_line1, loc.city, loc.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {det?.services_offered?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(det.services_offered as string[]).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {det?.whatsapp && (
                          <a href={`https://wa.me/${det.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-500 hover:text-white py-2 rounded-xl text-xs font-bold transition-all">
                            <WaIcon className="w-3.5 h-3.5" />WhatsApp
                          </a>
                        )}
                        <Link href={`/brand/${brandSlug}/pos/${p.id}`}
                          className="flex-1 flex items-center justify-center gap-1 bg-[#0B1F4D] text-white hover:bg-[#162d6e] py-2 rounded-xl text-xs font-bold transition-colors">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── CONTACT ──────────────────────────────────────────────────────── */}
        <section id="sec-contact">
          <SectionHeading icon={MessageCircle} title="Get In Touch" subtitle="Reach out for inquiries, quotes or partnerships" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Contact methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm space-y-5">
              <h3 className="font-extrabold text-[#0B1F4D] text-base">Contact Details</h3>
              <div className="space-y-4">
                {supplier.whatsapp && (
                  <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi! I'd like to get in touch.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 group">
                    <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <WaIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">WhatsApp</p>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-green-600 transition-colors">{supplier.whatsapp}</p>
                    </div>
                  </a>
                )}
                {supplier.phone && (
                  <a href={`tel:${supplier.phone}`} className="flex items-center gap-3 group">
                    <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Phone</p>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{supplier.phone}</p>
                    </div>
                  </a>
                )}
                {supplier.business_email && (
                  <a href={`mailto:${supplier.business_email}`} className="flex items-center gap-3 group">
                    <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Email</p>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{supplier.business_email}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Address + map */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm space-y-5">
              <h3 className="font-extrabold text-[#0B1F4D] text-base">Address</h3>
              {(supplier.address_line1 || city || country) && (
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {supplier.address_line1 && <p className="font-semibold">{supplier.address_line1}</p>}
                    {supplier.address_line2 && <p>{supplier.address_line2}</p>}
                    {(city || country) && (
                      <p>{city ? `${(city as any).name}, ` : ''}{country ? (country as any).name : ''} {supplier.postal_code ?? ''}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2.5">
                {supplier.google_map_link && (
                  <a href={supplier.google_map_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#0B1F4D] text-white text-sm font-bold hover:bg-[#162d6e] transition-colors shadow-sm">
                    <Navigation className="w-4 h-4" />Open in Google Maps
                  </a>
                )}
                {supplier.website && (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all">
                    <ExternalLink className="w-4 h-4" />Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {lightbox.type === 'video'
                ? <video src={lightbox.url} controls className="w-full h-full" />
                : <Image src={lightbox.url} alt={lightbox.caption ?? ''} fill className="object-contain" sizes="100vw" />
              }
            </div>
            {lightbox.caption && (
              <p className="text-center text-white/70 text-sm mt-4 font-medium">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
