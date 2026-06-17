'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BusinessCard } from '@/components/brand/BusinessCard'
import { SupplierCatalog } from '@/components/brand/SupplierCatalog'
import { CatalogueOverview } from '@/components/brand/CatalogueOverview'

const isoFlag = (iso?: string | null) =>
  iso && iso.length === 2 ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : ''
import {
  Package, Images, Award, Star, MapPin, MessageCircle, Info,
  Store, Warehouse, Truck, Building2, ShoppingBag, Briefcase, Anchor,
  Calendar, Globe, Share2, Check, Phone, Mail, Clock, Navigation,
  ExternalLink, Download, Play, X, BadgeCheck, ChevronRight, ChevronLeft, Reply,
  Radio, Users, FileText, Bell, Tag, Megaphone, LogIn, Loader, UserMinus, ArrowRight,
  FileSpreadsheet, FileImage, File as FileIcon,
  LayoutGrid, List as ListIcon, Search, Heart, Sparkles, Zap, ChevronDown,
  Cpu, Smartphone, Headphones, Cable, Speaker, Watch, BatteryCharging, Tablet, Laptop,
} from 'lucide-react'

// Best-effort icon per category name (XO-style left rail).
function catIcon(name: string) {
  const n = name.toLowerCase()
  if (/phone|mobile/.test(n)) return Smartphone
  if (/laptop|notebook/.test(n)) return Laptop
  if (/tablet|ipad/.test(n)) return Tablet
  if (/watch/.test(n)) return Watch
  if (/head|earbud|earphone|audio/.test(n)) return Headphones
  if (/speaker|sound/.test(n)) return Speaker
  if (/cable|charg/.test(n)) return Cable
  if (/power|battery/.test(n)) return BatteryCharging
  if (/tech|electronic|computer/.test(n)) return Cpu
  if (/accessor/.test(n)) return Watch
  return Package
}
import { createClient } from '@/lib/supabase/client'
import { formatCents } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'
import { BrandSidebar } from '@/components/brand/BrandSidebar'

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
  marketplace_context?: string | null
  family?: { id: string; name: string } | null
  root?: { id: string; name: string } | null
}
interface GalleryItem { id: string; url: string; type: 'image'|'video'; caption: string | null; sort_order: number }
interface Certification { id: string; title: string; issuer: string | null; issued_date: string | null; expiry_date: string | null; image_url: string | null }
interface Review { id: string; rating: number; comment: string | null; verified_purchase: boolean; supplier_reply: string | null; created_at: string; profiles: { full_name: string | null } | null }
interface Document { id: string; doc_type: string; file_url: string; uploaded_at: string; title?: string | null; file_name?: string | null; file_size_bytes?: number | null }

const DOC_TYPE_LABELS: Record<string, string> = {
  price_list: 'Price List', catalog: 'Product Catalog', brochure: 'Brochure',
  tax_certificate: 'Tax Certificate', business_license: 'Business License',
  vat_certificate: 'VAT Certificate', bank_proof: 'Bank Proof',
}
function docFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-green-600', bg: 'from-green-50 to-green-100' }
  if (ext === 'pdf') return { Icon: FileText, color: 'text-red-500', bg: 'from-red-50 to-red-100' }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { Icon: FileImage, color: 'text-blue-500', bg: 'from-blue-50 to-blue-100' }
  if (['doc', 'docx'].includes(ext)) return { Icon: FileText, color: 'text-blue-700', bg: 'from-blue-50 to-blue-100' }
  return { Icon: FileIcon, color: 'text-gray-500', bg: 'from-gray-50 to-gray-100' }
}
function fmtFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}
interface Channel {
  id: string; name: string; description: string | null; whatsapp: string | null
  member_count: number; post_count: number
}
interface ChannelPost {
  id: string; content: string; image_url: string | null; video_url?: string | null; post_type: string; created_at: string
}
interface Props {
  supplier: Supplier; products: Product[]; gallery: GalleryItem[]; certifications: Certification[]
  reviews: Review[]; documents: Document[]; avgRating: number; sectionVisibility: Record<string, boolean>
  pos: any[]; brandSlug: string; shareUrl?: string
  channel?: Channel | null; channelPosts?: ChannelPost[]
  isAuthenticated?: boolean
  canSeeB2B?: boolean
  contactUnlocked?: boolean
  categoryRoots?: { id: string; name: string }[]
}

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Stars ─────────────────────────────────────────────────────────────────────
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

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const t = useT()
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
      {copied ? <><Check className="w-4 h-4" />{t('brand.copied')}</> : <><Share2 className="w-4 h-4" />{t('brand.share')}</>}
    </button>
  )
}

// ── Section heading — color-coded per section ─────────────────────────────────
function SectionHeading({
  icon: Icon, title, subtitle, action, accent = '#0B1F4D'
}: {
  icon: React.ComponentType<{className?: string}>
  title: string; subtitle?: string; action?: React.ReactNode; accent?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-7">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}b3 100%)` }}>
          <span className="absolute inset-0 bg-white/10" style={{ maskImage: 'linear-gradient(135deg, transparent 40%, white 100%)' }} />
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white relative" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold leading-tight text-[#0B1F4D]">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          <div className="mt-2 h-1 w-10 rounded-full" style={{ background: accent }} />
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, wa, canSeeB2B = true, supplierId = '' }: { product: Product; wa: string | null; canSeeB2B?: boolean; supplierId?: string }) {
  const productHref = `/product/${product.slug ?? product.id}`
  const hasPrice = product.price_cents > 0
  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:border-[#0B1F4D]/25 transition-all duration-200">
      {/* Image */}
      <div className="relative">
        <Link href={productHref} className="block overflow-hidden" style={{ aspectRatio: '1/1', background: '#F7F7F5' }}>
          {product.thumb ? (
            <Image src={product.thumb} alt={product.name} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-300" sizes="240px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Images className="w-8 h-8 text-gray-200" /></div>
          )}
        </Link>
        <button aria-label="Save" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={productHref}>
          <h3 className="text-[13.5px] font-bold text-gray-800 leading-snug line-clamp-1 hover:text-[#0B1F4D] transition-colors">{product.name}</h3>
        </Link>
        {product.category_name && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{product.category_name}</p>
        )}

        <div className="mt-2">
          {hasPrice ? (
            <p className="text-[15px] font-extrabold text-[#0B1F4D]">
              {formatCents(product.price_cents, product.currency_code)}
              <span className="text-[11px] font-medium text-gray-400"> / Unit</span>
            </p>
          ) : (
            <p className="text-[12px] italic text-gray-400 font-medium">Price on request</p>
          )}
          {product.min_order_qty && product.marketplace_context !== 'retail' && (
            <p className="text-[11px] text-gray-400 mt-0.5">MOQ: {product.min_order_qty} Units</p>
          )}
          <p className="flex items-center gap-1 text-[11px] font-bold text-green-600 mt-1">
            <Zap className="w-3 h-3" fill="currentColor" /> In Stock
          </p>
        </div>

        {/* Purchase units — wholesale */}
        {product.marketplace_context !== 'retail' && (
          <div className="grid grid-cols-2 gap-1.5 mt-2.5">
            <span className="text-center rounded-md border border-gray-200 text-gray-500 text-[11px] font-semibold py-1.5">Box</span>
            <span className="text-center rounded-md border border-gray-200 text-gray-500 text-[11px] font-semibold py-1.5">Pallet</span>
          </div>
        )}

        <Link href={productHref}
          className="mt-2 block text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-[12px] font-bold transition-colors">
          View Product
        </Link>
      </div>
    </div>
  )
}

// ── Product browser — left category rail + sortable/paginated grid ────────────
const PAGE_SIZE = 12
type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'name'

function ProductRow({ product, wa }: { product: Product; wa: string | null }) {
  const href = `/product/${product.slug ?? product.id}`
  return (
    <Link href={href} className="group flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-[#0B1F4D]/20 transition-all">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F5F3]">
        {product.thumb
          ? <Image src={product.thumb} alt={product.name} fill className="object-cover" sizes="80px" />
          : <div className="w-full h-full flex items-center justify-center"><Images className="w-6 h-6 text-gray-200" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        {product.category_name && <p className="text-[10px] text-[#F5A623] font-bold uppercase tracking-wide truncate">{product.category_name}</p>}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{product.name}</h3>
        {product.min_order_qty && product.marketplace_context !== 'retail' && (
          <p className="text-[11px] text-gray-400 mt-0.5">MOQ {product.min_order_qty}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="block text-sm font-extrabold text-[#0B1F4D]">
          {product.price_cents > 0 ? formatCents(product.price_cents, product.currency_code) : <span className="text-gray-400 font-normal italic text-[11px]">On request</span>}
        </span>
        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#0B1F4D] group-hover:gap-1.5 transition-all">View <ChevronRight className="w-3 h-3" /></span>
      </div>
    </Link>
  )
}

function ProductBrowser({ products, wa, supplierId, canSeeB2B = true, categoryRoots = [] }: { products: Product[]; wa: string | null; supplierId: string; canSeeB2B?: boolean; categoryRoots?: { id: string; name: string }[] }) {
  // activeKey: 'all' | `root:<id>` | `family:<id>`
  const [activeKey, setActiveKey] = useState<string>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortKey>('popular')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // Build the Category → Family tree from the products. Only categories and
  // families that actually have products appear (empty ones are hidden).
  const tree = useMemo(() => {
    const roots = new Map<string, { id: string; name: string; count: number; families: Map<string, { id: string; name: string; count: number }> }>()
    for (const p of products) {
      const root = p.root ?? { id: 'other', name: p.category_name ?? 'Other' }
      let r = roots.get(root.id)
      if (!r) { r = { id: root.id, name: root.name, count: 0, families: new Map() }; roots.set(root.id, r) }
      r.count++
      if (p.family) {
        let f = r.families.get(p.family.id)
        if (!f) { f = { id: p.family.id, name: p.family.name, count: 0 }; r.families.set(p.family.id, f) }
        f.count++
      }
    }
    return Array.from(roots.values())
      .map((r) => ({ ...r, families: Array.from(r.families.values()).sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => b.count - a.count)
  }, [products])

  // Always show the fixed list of MAIN categories. Ones with products are active;
  // ones without are locked ("Coming soon"). Extra product-roots (not in the fixed
  // list) are appended so nothing is hidden.
  const displayRoots = useMemo(() => {
    const treeById = new Map(tree.map((r) => [r.id, r]))
    const out: Array<{ id: string; name: string; count: number; families: { id: string; name: string; count: number }[]; locked: boolean }> = []
    const seen = new Set<string>()
    for (const root of categoryRoots) {
      const t = treeById.get(root.id)
      out.push(t ? { ...t, locked: false } : { id: root.id, name: root.name, count: 0, families: [], locked: true })
      seen.add(root.id)
    }
    for (const t of tree) if (!seen.has(t.id)) out.push({ ...t, locked: false })
    return out
  }, [categoryRoots, tree])

  const activeLabel = useMemo(() => {
    if (activeKey === 'all') return 'All Products'
    const [type, id] = activeKey.split(':')
    for (const r of tree) {
      if (type === 'root' && r.id === id) return r.name
      const f = r.families.find((f) => f.id === id)
      if (type === 'family' && f) return f.name
    }
    return 'Products'
  }, [activeKey, tree])

  const filtered = useMemo(() => {
    let list = products
    if (activeKey !== 'all') {
      const [type, id] = activeKey.split(':')
      list = type === 'family'
        ? list.filter((p) => p.family?.id === id)
        : list.filter((p) => (p.root?.id ?? 'other') === id)
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    const sorted = [...list]
    if (sort === 'price_asc') sorted.sort((a, b) => (a.price_cents || Infinity) - (b.price_cents || Infinity))
    else if (sort === 'price_desc') sorted.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0))
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    return sorted
  }, [products, activeKey, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 whenever the filter set changes
  useEffect(() => { setPage(1) }, [activeKey, query, sort])

  const toggleRoot = (id: string) => setExpanded((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const pageNumbers = useMemo(() => {
    const out: (number | '…')[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) out.push(i)
      else if (out[out.length - 1] !== '…') out.push('…')
    }
    return out
  }, [totalPages, safePage])

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
      {/* ── Left category rail ── */}
      <aside className="lg:w-52 flex-shrink-0 space-y-4">
        <div className="lg:bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm lg:p-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Categories</p>
          <div className="space-y-0.5">
            {/* All products */}
            <button onClick={() => setActiveKey('all')}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${activeKey === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <LayoutGrid className="w-4 h-4 flex-shrink-0" />
              <span className="truncate flex-1 text-left">All Products</span>
              <span className="text-[11px] text-gray-400">{products.length}</span>
            </button>

            {/* Fixed main categories — locked when they have no products */}
            {displayRoots.map((r) => {
              const Icon = catIcon(r.name)
              const isOpen = expanded.has(r.id)
              const rootActive = activeKey === `root:${r.id}`

              if (r.locked) {
                return (
                  <div key={r.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-300 cursor-not-allowed select-none" title="No products yet">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{r.name}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Soon</span>
                  </div>
                )
              }

              return (
                <div key={r.id}>
                  <div className={`flex items-center rounded-lg transition-colors ${rootActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <button onClick={() => setActiveKey(`root:${r.id}`)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold flex-1 min-w-0 ${rootActive ? 'text-blue-700' : 'text-gray-700'}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{r.name}</span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{r.count}</span>
                    </button>
                    {r.families.length > 0 && (
                      <button onClick={() => toggleRoot(r.id)} aria-label="Toggle families"
                        className="px-2 py-2 text-gray-400 hover:text-gray-700 flex-shrink-0">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {/* Families — only those with products */}
                  {isOpen && r.families.length > 0 && (
                    <div className="ml-3 pl-3 border-l border-gray-100 space-y-0.5 py-0.5">
                      {r.families.map((f) => {
                        const famActive = activeKey === `family:${f.id}`
                        return (
                          <button key={f.id} onClick={() => setActiveKey(`family:${f.id}`)}
                            className={`w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors ${famActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <span className="truncate flex-1 text-left">{f.name}</span>
                            <span className="text-[11px] text-gray-400">{f.count}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Need custom products card */}
        {wa && (
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <Sparkles className="w-6 h-6 text-[#F5A623] mx-auto mb-1.5" />
            <p className="text-sm font-extrabold text-[#0B1F4D]">Need Custom Products?</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">We can source it for you.</p>
            <a href={`${wa}?text=Hi! I'd like to request a custom product / quote.`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[#0B1F4D]/15 text-[#0B1F4D] text-xs font-bold py-2 hover:bg-[#0B1F4D] hover:text-white transition-colors">
              <ArrowRight className="w-3.5 h-3.5" /> Request Custom Offer
            </a>
          </div>
        )}
      </aside>

      {/* ── Center: toolbar + grid + pagination ── */}
      <div className="flex-1 min-w-0">
        {/* Heading + toolbar */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#0B1F4D] capitalize">{activeLabel}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length === 0 ? 'No products' : <>Showing {(safePage - 1) * PAGE_SIZE + 1} – {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} products</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
                className="w-36 rounded-lg border border-gray-200 pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20">
              <option value="popular">Sort by: Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setView('grid')} aria-label="Grid view"
                className={`p-1.5 ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} aria-label="List view"
                className={`p-1.5 ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid / list */}
        {pageItems.length > 0 ? (
          view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {pageItems.map((p) => <ProductCard key={p.id} product={p} wa={wa} supplierId={supplierId} canSeeB2B={canSeeB2B} />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {pageItems.map((p) => <ProductRow key={p.id} product={p} wa={wa} />)}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
            No products match your filters.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((n, i) => n === '…'
              ? <span key={`e${i}`} className="px-1.5 text-gray-300">…</span>
              : <button key={n} onClick={() => setPage(n)}
                  className={`min-w-9 h-9 px-3 rounded-lg text-sm font-bold transition-colors ${
                    n === safePage ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {n}
                </button>)}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Canal post type config ────────────────────────────────────────────────────
const CANAL_POST_TYPES: Record<string, { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',    Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700',  Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700',Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700',  Icon: Megaphone },
}

// ── Nav config (static IDs — labels translated inside component) ──────────────
const NAV_ITEM_IDS = [
  { id: 'products',       msgKey: 'brand.tab_products', Icon: Package,        accent: '#0B1F4D' },
  { id: 'about',          msgKey: 'brand.tab_about',    Icon: Info,           accent: '#1D4ED8' },
  { id: 'gallery',        msgKey: 'brand.tab_gallery',  Icon: Images,         accent: '#5B21B6' },
  { id: 'certifications', msgKey: 'brand.tab_certs',    Icon: Award,          accent: '#B45309' },
  { id: 'reviews',        msgKey: 'brand.tab_reviews',  Icon: Star,           accent: '#B45309' },
  { id: 'locations',      msgKey: 'brand.tab_locations',Icon: MapPin,         accent: '#065F46' },
  { id: 'contact',        msgKey: 'brand.tab_contact',  Icon: MessageCircle,  accent: '#0E7490' },
  { id: 'canal',          msgKey: 'brand.tab_canal',    Icon: Radio,          accent: '#7C3AED' },
]

// ── POS type config ───────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export function BrandTabs({
  supplier, products, gallery, certifications, reviews, documents,
  avgRating, sectionVisibility, pos, brandSlug, shareUrl,
  channel, channelPosts = [], isAuthenticated = false, canSeeB2B = false,
  contactUnlocked = false, categoryRoots = [],
}: Props) {
  const t = useT()
  const sidebarVideos = useMemo(
    () => gallery.filter((g) => g.type === 'video').map((g) => ({ id: g.id, url: g.url, caption: g.caption })),
    [gallery]
  )

  // Which channels this supplier actually sells on — so we never show an empty shop.
  const hasB2BProducts    = useMemo(() => products.some((p) => { const c = p.marketplace_context ?? 'wholesale'; return c === 'wholesale' || c === 'both' }), [products])
  const hasRetailProducts = useMemo(() => products.some((p) => p.marketplace_context === 'retail' || p.marketplace_context === 'both'), [products])
  const showB2BShop    = canSeeB2B && hasB2BProducts
  const showRetailShop = hasRetailProducts
  const NAV_ITEMS = NAV_ITEM_IDS.map(item => ({ ...item, label: t(item.msgKey) }))

  const [activeSection, setActiveSection] = useState('products')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  // Canal join state
  const [canalUser,     setCanalUser]     = useState<{ id: string } | null>(null)
  const [canalMember,   setCanalMember]   = useState(false)
  const [canalLoading,  setCanalLoading]  = useState(false)
  const [canalBusy,     setCanalBusy]     = useState(false)

  const wa = supplier.whatsapp ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}` : null
  const country = supplier.countries as any as { name: string } | null
  const city    = supplier.cities   as any as { name: string } | null

  // "Why choose us" — data-driven trust highlights (top 4 available)
  const sup = supplier as any
  const TIER_LABEL: Record<string, string> = { GOLD: 'Gold Verified', SILVER: 'Verified Supplier', BRONZE: 'Bronze Verified', UNVERIFIED: 'Supplier' }
  const highlights = ([
    sup.reliability_tier && sup.reliability_tier !== 'UNVERIFIED'
      ? { Icon: BadgeCheck, value: TIER_LABEL[sup.reliability_tier] ?? 'Verified', label: 'Trusted & audited', color: '#16a34a', bg: 'bg-green-50' } : null,
    sup.years_experience ? { Icon: Calendar, value: `${sup.years_experience}+ yrs`, label: 'In business', color: '#0B1F4D', bg: 'bg-blue-50' } : null,
    sup.countries_served ? { Icon: Globe, value: `${sup.countries_served}+`, label: 'Countries served', color: '#2563eb', bg: 'bg-sky-50' } : null,
    certifications.length > 0 ? { Icon: Award, value: `${certifications.length}`, label: 'Quality certifications', color: '#b45309', bg: 'bg-amber-50' } : null,
    sup.whatsapp ? { Icon: MessageCircle, value: 'Fast reply', label: 'Responds in hours', color: '#16a34a', bg: 'bg-emerald-50' } : null,
    products.length > 0 ? { Icon: Package, value: `${products.length}`, label: 'Products in catalogue', color: '#7c3aed', bg: 'bg-purple-50' } : null,
  ].filter(Boolean) as { Icon: any; value: string; label: string; color: string; bg: string }[]).slice(0, 4)

  // Canal auth check — runs when channel prop is present
  useEffect(() => {
    if (!channel) return
    const supabase = createClient()
    setCanalLoading(true)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCanalUser(user)
      if (user) {
        ;(supabase.from('channel_members') as any)
          .select('id')
          .eq('channel_id', channel.id)
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }: { data: any }) => { setCanalMember(!!data); setCanalLoading(false) })
      } else {
        setCanalLoading(false)
      }
    })
  }, [channel])

  const handleCanalJoin = async () => {
    if (!channel) return
    if (!canalUser) { window.location.href = `/login?next=/brand/${brandSlug}`; return }
    setCanalBusy(true)
    if (canalMember) {
      await fetch(`/api/channels/${channel.id}/join`, { method: 'DELETE' })
      setCanalMember(false)
    } else {
      await fetch(`/api/channels/${channel.id}/join`, { method: 'POST' })
      setCanalMember(true)
    }
    setCanalBusy(false)
  }

  // Visible nav
  const visibleNav = NAV_ITEMS.filter(item => {
    if (item.id === 'products'       && products.length === 0) return false
    if (item.id === 'canal'          && !channel) return false
    if (item.id === 'gallery'        && (gallery.length === 0 || sectionVisibility.gallery === false)) return false
    if (item.id === 'certifications' && (certifications.length === 0 || sectionVisibility.certifications === false)) return false
    if (item.id === 'reviews'        && sectionVisibility.reviews === false) return false
    if (item.id === 'locations'      && pos.length === 0) return false
    return true
  })

  // Scroll reveal — runs once after mount
  useEffect(() => {
    const DURATION = '0.55s'
    const EASE = 'cubic-bezier(0.16,1,0.3,1)'
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.unobserve(el)
        }
      }),
      { threshold: 0.07, rootMargin: '-10px' }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const h = el as HTMLElement
      h.style.opacity = '0'
      h.style.transform = 'translateY(22px)'
      h.style.transition = `opacity ${DURATION} ${EASE}, transform ${DURATION} ${EASE}`
      observer.observe(h)
    })
    return () => observer.disconnect()
  }, [])

  // Scrollspy — fixed offset: sub-bar (48px) + BrandTabs nav (~48px) = 96px + buffer
  useEffect(() => {
    const OFFSET = 108
    const onScroll = () => {
      for (let i = visibleNav.length - 1; i >= 0; i--) {
        const el = document.getElementById(`sec-${visibleNav[i].id}`)
        if (el && el.getBoundingClientRect().top <= OFFSET) {
          setActiveSection(visibleNav[i].id)
          return
        }
      }
      setActiveSection(visibleNav[0]?.id ?? 'products')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [visibleNav])

  const scrollTo = (id: string) => {
    const el = document.getElementById(`sec-${id}`)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 105, behavior: 'smooth' })
  }

  return (
    <>
      {/* ── STICKY TAB NAV ─────────────────────────────────────────────────── */}
      <div className="sticky top-[48px] z-20 bg-white/96 backdrop-blur border-b border-gray-200 -mx-4 sm:-mx-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center">
          {/* Tab list with right-fade to signal overflow */}
          <div className="relative flex-1 min-w-0">
            <div className="overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center min-w-max">
                {visibleNav.map(item => {
                  const isActive = activeSection === item.id
                  const count =
                    item.id === 'products'  ? products.length          :
                    item.id === 'reviews'   ? reviews.length           :
                    item.id === 'locations' ? pos.length               :
                    item.id === 'gallery'   ? gallery.length           :
                    item.id === 'canal'     ? (channel?.member_count ?? 0) : 0
                  return (
                    <button key={item.id} onClick={() => scrollTo(item.id)}
                      className="relative flex items-center gap-1.5 px-3.5 sm:px-4 py-3.5 text-[13px] font-semibold transition-colors whitespace-nowrap"
                      style={{ color: isActive ? item.accent : '#9CA3AF' }}>
                      {/* Icon only on active or desktop */}
                      {isActive
                        ? <item.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        : <item.Icon className="w-3.5 h-3.5 flex-shrink-0 hidden sm:block" />
                      }
                      <span>{item.label}</span>
                      {count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{ background: isActive ? item.accent : '#F3F4F6', color: isActive ? 'white' : '#9CA3AF' }}>
                          {count}
                        </span>
                      )}
                      <span className={`absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full origin-center transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                        style={{ background: item.accent }} />
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Fade hint — more tabs to the right */}
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-10 sm:hidden"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95))' }} />
          </div>
          {shareUrl && (
            <div className="pl-2 flex-shrink-0 hidden sm:block border-l border-gray-200 ml-1">
              <ShareButton url={shareUrl} />
            </div>
          )}
        </div>
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-16 sm:gap-20 pb-28 sm:pb-14">

        {/* ══════════════ SUPPLIER CATALOG (Excel) ════════════════════════════ */}
        <section id="sec-catalog" data-reveal><SupplierCatalog documents={documents as any} /></section>

        {/* ══════════════ PRODUCTS ════════════════════════════════════════════ */}
        {products.length > 0 && (
          <section id="sec-products">
            <div data-reveal>
              <SectionHeading
                icon={ShoppingBag}
                title={`Shop ${supplier.trade_name ?? supplier.legal_name ?? ''}`}
                subtitle="Choose how you’d like to buy — wholesale or retail"
                accent="#0B1F4D"
              />
            </div>

            {/* ── Shops: only the channels this supplier actually sells on ── */}
            {(showB2BShop || showRetailShop) && (
            <div data-reveal className={`grid grid-cols-1 ${showB2BShop && showRetailShop ? 'sm:grid-cols-2' : ''} gap-4 mb-14`}>
              {/* Shop B2B — hidden from consumers & when no wholesale products */}
              {showB2BShop && (
              <Link href={`/marketplace?supplier=${supplier.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] px-5 py-4 flex items-center justify-between">
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-base leading-tight">Shop B2B</p>
                      <p className="text-white/60 text-xs">Wholesale</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-white/80 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Bulk</span>
                </div>
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">
                    Order by <strong className="text-gray-700">box, pallet or full truck</strong>. Wholesale pricing for distributors &amp; retailers.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#0B1F4D] group-hover:gap-2.5 transition-all">
                    Enter B2B Shop <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
              )}

              {/* Online Shop — only when they have retail products */}
              {showRetailShop && (
              <Link href={`/store?supplier=${supplier.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-violet-800 px-5 py-4 flex items-center justify-between">
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-base leading-tight">Online Shop</p>
                      <p className="text-white/60 text-xs">Retail · By piece</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-white/80 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Retail</span>
                </div>
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">
                    Buy <strong className="text-gray-700">individual pieces</strong> shipped directly to you — no minimum order.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-purple-700 group-hover:gap-2.5 transition-all">
                    Enter Online Shop <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
              )}
            </div>
            )}

            {/* ── Canal subscribe banner (when supplier has a channel) ── */}
            {channel && (
              <button data-reveal onClick={() => scrollTo('canal')}
                className="group w-full mb-14 flex items-center gap-4 rounded-2xl px-5 sm:px-6 py-4 text-left shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 60%, #6D28D9 100%)' }}>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                <div className="relative w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <p className="text-white font-extrabold text-base leading-tight">Follow {supplier.trade_name ?? supplier.legal_name} on Canal</p>
                  <p className="text-white/70 text-sm">
                    {channel.member_count.toLocaleString()} subscribers · Get exclusive offers &amp; new product drops
                  </p>
                </div>
                <span className="relative flex-shrink-0 inline-flex items-center gap-1.5 bg-white text-[#7C3AED] px-4 py-2 rounded-xl text-sm font-extrabold group-hover:gap-2.5 transition-all">
                  Subscribe <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            )}

            {/* ── Catalogue: left categories rail + sortable/paginated grid ── */}
            <div data-reveal className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-[#0B1F4D]" />
                <h3 className="text-lg font-extrabold text-[#0B1F4D]">Product Catalogue</h3>
                <span className="text-sm text-gray-400">· {products.length} products</span>
              </div>
              {wa && (
                <a href={`${wa}?text=Hi! I'd like to request your full catalogue.`}
                  target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <WaIcon className="w-4 h-4" />{t('brand.request_catalogue')}
                </a>
              )}
            </div>

            {/* Professional catalogue overview — main brands, categories and 4–5
                featured products each + "View Full Excel Catalogue" (lets large
                suppliers onboard without uploading thousands of products). */}
            <CatalogueOverview
              products={products as any}
              hasExcel={(documents as any[]).some((d) => /\.(xlsx|xls|csv)(\?|$)/.test(String(d.file_name ?? d.file_url ?? '').toLowerCase()) || ['catalog', 'price_list'].includes(d.doc_type))}
            />

            {/* Right rail only when it has real content (docs/videos) — otherwise
                the catalogue uses the full width instead of leaving an empty column. */}
            {(documents.length > 0 || sidebarVideos.length > 0) ? (
              <div data-reveal id="sec-products" className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7 lg:items-start">
                <div className="min-w-0">
                  <ProductBrowser products={products} wa={wa} supplierId={supplier.id} canSeeB2B={canSeeB2B} categoryRoots={categoryRoots} />
                </div>
                <BrandSidebar
                  className="hidden lg:block lg:sticky lg:top-[112px] mt-8 lg:mt-0"
                  documents={documents as any}
                  videos={sidebarVideos}
                  supplier={supplier as any}
                  contactUnlocked={contactUnlocked}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            ) : (
              <div data-reveal id="sec-products">
                <ProductBrowser products={products} wa={wa} supplierId={supplier.id} canSeeB2B={canSeeB2B} categoryRoots={categoryRoots} />
              </div>
            )}

            {/* CTA banner */}
            {wa && (
              <div data-reveal className="mt-12 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3a7a 60%, #0d3060 100%)' }}>
                <div className="px-8 py-9 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div>
                    <p className="text-white font-extrabold text-xl mb-1">{t('brand.bulk_cta')}</p>
                    <p className="text-white/55 text-sm">{t('brand.bulk_sub')}</p>
                  </div>
                  <a href={`${wa}?text=Hi! I'd like to request a catalogue and pricing from your store.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-2 bg-[#F5A623] hover:bg-amber-400 text-[#0B1F4D] px-6 py-3.5 rounded-xl font-extrabold transition-colors shadow-lg whitespace-nowrap">
                    <WaIcon className="w-5 h-5" />{t('brand.bulk_btn')}
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════════ WHY CHOOSE US — trust highlights ════════════════════ */}
        {highlights.length > 0 && (
          <section id="sec-why" data-reveal>
            <div className="rounded-3xl bg-gradient-to-br from-[#0B1F4D] to-[#16306b] p-6 sm:p-8 relative overflow-hidden">
              {/* decorative */}
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative">
                <p className="text-[#F5A623] text-xs font-extrabold uppercase tracking-widest mb-1">Why work with us</p>
                <h2 className="text-white text-xl sm:text-2xl font-extrabold mb-6">
                  {supplier.trade_name ?? supplier.legal_name} at a glance
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {highlights.map((h, i) => (
                    <div key={h.label} className="bg-white/[0.07] border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/[0.11] transition-colors"
                      style={{ animationDelay: `${i * 80}ms` }}>
                      <div className={`w-10 h-10 rounded-xl ${h.bg} flex items-center justify-center mb-3`}>
                        <h.Icon className="w-5 h-5" style={{ color: h.color }} />
                      </div>
                      <p className="text-white font-extrabold text-base leading-tight">{h.value}</p>
                      <p className="text-white/55 text-xs mt-0.5">{h.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════ CANAL ═══ (ordered near the bottom) ═════════════════ */}
        {channel && (
          <section id="sec-canal" className="order-[40]">
            <div data-reveal>
              <SectionHeading
                icon={Radio}
                title={channel.name}
                subtitle="Join to receive exclusive updates, offers and announcements"
                accent="#7C3AED"
              />
            </div>

            {/* Hero join card */}
            <div data-reveal className="rounded-2xl overflow-hidden shadow-lg mb-6"
              style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 60%, #6D28D9 100%)' }}>
              <div className="px-7 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Radio className="w-5 h-5 text-purple-300" />
                    <span className="text-purple-200 text-xs font-bold uppercase tracking-widest">Official Canal</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-1 leading-tight">{channel.name}</h3>
                  {channel.description && (
                    <p className="text-white/60 text-sm leading-relaxed">{channel.description}</p>
                  )}
                  <div className="flex items-center gap-5 mt-4">
                    <div className="flex items-center gap-1.5 text-white/60 text-sm">
                      <Users className="w-4 h-4" />
                      <span className="font-extrabold text-white">{channel.member_count.toLocaleString()}</span>
                      <span>members</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60 text-sm">
                      <FileText className="w-4 h-4" />
                      <span className="font-extrabold text-white">{channel.post_count.toLocaleString()}</span>
                      <span>posts</span>
                    </div>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                  <button onClick={handleCanalJoin} disabled={canalLoading || canalBusy}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-60 ${
                      canalMember
                        ? 'bg-white/20 hover:bg-red-500 text-white border border-white/30'
                        : canalUser
                          ? 'bg-[#F5A623] hover:bg-amber-400 text-[#0B1F4D]'
                          : 'bg-white hover:bg-gray-100 text-[#7C3AED]'
                    }`}>
                    {(canalLoading || canalBusy)
                      ? <Loader className="w-4 h-4 animate-spin" />
                      : canalMember
                        ? <><Check className="w-4 h-4" /></>
                        : canalUser
                          ? <Radio className="w-4 h-4" />
                          : <LogIn className="w-4 h-4" />
                    }
                    {(canalLoading || canalBusy)
                      ? t('brand.channel_waiting')
                      : canalMember ? t('brand.channel_joined')
                      : canalUser   ? t('brand.channel_join')
                      : t('brand.channel_login')
                    }
                  </button>
                  {channel.whatsapp && (
                    <a href={`https://wa.me/${channel.whatsapp.replace(/\D/g,'')}?text=Hi! I joined your TTAI canal.`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-400 text-white transition-colors shadow-lg">
                      <WaIcon className="w-4 h-4" />WhatsApp
                    </a>
                  )}
                  <a href={`/channel/${channel.id}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
                    <ExternalLink className="w-4 h-4" />{t('brand.channel_view')}
                  </a>
                </div>
              </div>
            </div>

            {/* Recent posts preview */}
            {channelPosts.length > 0 && (
              <div data-reveal className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('brand.channel_posts')}</p>
                {channelPosts.map((post, idx) => {
                  const cfg = CANAL_POST_TYPES[post.post_type] ?? CANAL_POST_TYPES.update
                  const PostIcon = cfg.Icon
                  return (
                    <div key={post.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                      style={{ transitionDelay: `${idx * 60}ms` }}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                          <PostIcon className="w-3 h-3" />{cfg.label}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{post.content}</p>
                      {post.video_url ? (
                        <video src={post.video_url} controls className="mt-2 w-full rounded-xl bg-black max-h-40" />
                      ) : post.image_url && (
                        <img src={post.image_url} alt="" className="mt-2 w-full rounded-xl object-cover max-h-40" />
                      )}
                    </div>
                  )
                })}
                <a href={`/channel/${channel.id}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[#7C3AED] text-[#7C3AED] font-bold text-sm hover:bg-[#7C3AED] hover:text-white transition-all">
                  <Radio className="w-4 h-4" />{t('brand.channel_view_all')}
                </a>
              </div>
            )}

            {channelPosts.length === 0 && (
              <div data-reveal className="bg-white rounded-2xl border border-dashed border-purple-200 p-10 text-center">
                <Radio className="w-8 h-8 text-purple-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-medium">{t('brand.channel_empty')}</p>
              </div>
            )}
          </section>
        )}

        {/* ══════════════ ABOUT ═══════════════════════════════════════════════ */}
        <section id="sec-about">
          <div data-reveal>
            <SectionHeading icon={Info} title={t('brand.about_title')} accent="#1D4ED8" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description — blue left accent */}
            <div data-reveal className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-7 shadow-sm"
              style={{ borderLeft: '4px solid #1D4ED8' }}>
              {(supplier.about_company || supplier.description) ? (
                <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-line">
                  {supplier.about_company ?? supplier.description}
                </p>
              ) : (
                <p className="text-gray-400 italic text-sm">No company description added yet.</p>
              )}
              {[supplier.instagram, supplier.linkedin, supplier.facebook, supplier.youtube].some(Boolean) && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                  {[
                    { url: supplier.instagram, label: 'Instagram', color: '#E1306C' },
                    { url: supplier.linkedin,  label: 'LinkedIn',  color: '#0077B5' },
                    { url: supplier.facebook,  label: 'Facebook',  color: '#1877F2' },
                    { url: supplier.youtube,   label: 'YouTube',   color: '#FF0000' },
                  ].filter(s => s.url).map(s => (
                    <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold hover:opacity-70 transition-opacity"
                      style={{ color: s.color }}>
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
            {/* Quick facts */}
            <div data-reveal className="space-y-3">
              {[
                { label: t('brand.founded'),  value: supplier.founded_year?.toString(), Icon: Calendar, bg: 'bg-indigo-50',  iconColor: 'text-indigo-600' },
                { label: t('brand.location'), value: city ? `${(city as any).name}, ${(country as any)?.name ?? ''}` : country ? (country as any).name : null, Icon: MapPin, bg: 'bg-green-50', iconColor: 'text-green-600' },
                { label: t('brand.website'),  value: supplier.website?.replace(/^https?:\/\//, '') ?? null, Icon: Globe, bg: 'bg-blue-50', iconColor: 'text-blue-600', href: supplier.website },
                { label: t('brand.hours'),    value: supplier.working_hours, Icon: Clock, bg: 'bg-orange-50', iconColor: 'text-orange-500' },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${r.bg} flex items-center justify-center flex-shrink-0`}>
                    <r.Icon className={`w-5 h-5 ${r.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{r.label}</p>
                    {r.href ? (
                      <a href={r.href} target="_blank" rel="noopener noreferrer"
                        className="font-extrabold text-[#0B1F4D] text-sm hover:underline truncate block">{r.value}</a>
                    ) : (
                      <p className="font-extrabold text-[#0B1F4D] text-sm truncate">{r.value}</p>
                    )}
                  </div>
                </div>
              ))}
              {wa && (
                <a href={`${wa}?text=Hi! I found your store on TTAI and I'd like to know more.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-400 text-white py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm mt-2">
                  <WaIcon className="w-5 h-5" />{t('brand.send_message')}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════ GALLERY ═════════════════════════════════════════════ */}
        {gallery.length > 0 && sectionVisibility.gallery !== false && (
          <section id="sec-gallery">
            <div data-reveal>
              <SectionHeading icon={Images} title="Gallery" subtitle={`${gallery.length} photos & videos`} accent="#5B21B6" />
            </div>

            {/* Compact uniform gallery grid — square tiles, contained height */}
            <div data-reveal className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.slice(0, 12).map((item) => (
                  <button key={item.id} onClick={() => setLightbox(item)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-purple-400 hover:-translate-y-0.5">
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <Image src={item.url} alt={item.caption ?? ''} fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width:640px) 50vw, 25vw" />
                    )}
                    {/* Hover overlay + caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {item.caption && (
                      <div className="absolute bottom-0 inset-x-0 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[11px] font-semibold truncate drop-shadow">{item.caption}</p>
                      </div>
                    )}
                  </button>
              ))}
            </div>

            {/* +N more */}
            {gallery.length > 12 && (
              <button data-reveal onClick={() => setLightbox(gallery[12])}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#5B21B6] hover:underline">
                <Images className="w-4 h-4" />View all {gallery.length} photos &amp; videos
              </button>
            )}
          </section>
        )}

        {/* ══════════════ CERTIFICATIONS ══════════════════════════════════════ */}
        {(certifications.length > 0 || documents.length > 0) && sectionVisibility.certifications !== false && (
          <section id="sec-certifications">
            <div data-reveal>
              <SectionHeading icon={Award} title="Certifications & Documents"
                subtitle={`${certifications.length} certifications · quality assured`}
                accent="#B45309" />
            </div>
            {certifications.length > 0 && (
              <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {certifications.map((cert, idx) => {
                  const valid = cert.expiry_date ? new Date(cert.expiry_date) > new Date() : true
                  const daysLeft = cert.expiry_date
                    ? Math.ceil((new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null
                  const urgency = daysLeft !== null && daysLeft > 0 && daysLeft < 90
                  return (
                    <div key={cert.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                      {/* Color accent bar */}
                      <div className="h-1.5 w-full"
                        style={{ background: valid
                          ? urgency
                            ? 'linear-gradient(to right, #F59E0B, #FCD34D)'
                            : 'linear-gradient(to right, #D97706, #F59E0B)'
                          : 'linear-gradient(to right, #EF4444, #F87171)' }} />
                      <div className="p-5 flex gap-4 items-start">
                        {cert.image_url ? (
                          <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                            <Image src={cert.image_url} alt={cert.title} fill className="object-contain p-1.5" sizes="56px" />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm ${
                            valid ? 'bg-gradient-to-br from-amber-50 to-yellow-100' : 'bg-red-50'
                          }`}>
                            <Award className={`w-7 h-7 ${valid ? 'text-amber-500' : 'text-red-400'}`} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-snug mb-0.5 group-hover:text-[#B45309] transition-colors">{cert.title}</p>
                          {cert.issuer && (
                            <p className="text-xs text-gray-400 mb-2.5">{cert.issuer}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {cert.issued_date && (
                              <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full font-medium">
                                {new Date(cert.issued_date).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              !valid
                                ? 'bg-red-50 text-red-600'
                                : urgency
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-green-50 text-green-700'
                            }`}>
                              <BadgeCheck className="w-3 h-3" />
                              {!valid
                                ? t('brand.expired')
                                : urgency
                                  ? `${daysLeft}d left`
                                  : t('brand.valid')}
                              {cert.expiry_date && ` · ${new Date(cert.expiry_date).getFullYear()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {documents.length > 0 && (
              <div data-reveal>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('brand.documents')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map(doc => {
                    const { Icon, color, bg } = docFileIcon(doc.file_name ?? doc.file_url)
                    const label = doc.title || DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type.replace(/_/g, ' ')
                    const meta = [fmtFileSize(doc.file_size_bytes), new Date(doc.uploaded_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')
                    return (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" download
                        className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group hover:border-amber-200 hover:-translate-y-0.5">
                        <div className={`w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center shadow-sm`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 capitalize truncate group-hover:text-[#B45309] transition-colors">{label}</p>
                          <p className="text-xs text-gray-400">{meta}</p>
                        </div>
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                          <Download className="w-4 h-4 text-amber-500 group-hover:text-white transition-colors" />
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════════ DIGITAL BUSINESS CARD ═══════════════════════════════ */}
        <section id="sec-card" data-reveal>
          <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6 sm:p-8">
            <div className="text-center mb-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5A623]">Digital Business Card</p>
              <h2 className="text-xl font-extrabold text-[#0B1F4D]">Save &amp; share this business</h2>
              <p className="text-sm text-gray-400 mt-1">Flip the card, pick a style, share it or save the contact.</p>
            </div>
            <BusinessCard
              defaultTemplate={(supplier as any).card_template ?? undefined}
              data={{
                name: (supplier as any).trade_name ?? (supplier as any).legal_name ?? 'Business',
                legal: (supplier as any).legal_name, tagline: (supplier as any).tagline, logo: (supplier as any).logo_url,
                country: ((supplier as any).countries)?.name ?? null, city: ((supplier as any).cities)?.name ?? null,
                flag: isoFlag(((supplier as any).countries)?.iso_code) || '',
                website: (supplier as any).website, phone: (supplier as any).phone, whatsapp: (supplier as any).whatsapp, email: (supplier as any).business_email,
                slug: brandSlug ?? '', tier: (supplier as any).reliability_tier, verified: (supplier as any).status === 'ACTIVE', url: shareUrl ?? '',
              }}
            />
          </div>
        </section>

        {/* ══════════════ REVIEWS ═════════════════════════════════════════════ */}
        {sectionVisibility.reviews !== false && (
          <section id="sec-reviews">
            <div data-reveal>
              <SectionHeading icon={Star} title={t('brand.reviews_title')}
                subtitle={reviews.length > 0 ? `${avgRating.toFixed(1)} ${t('brand.reviews_avg')} · ${reviews.length}` : t('brand.reviews_none')}
                accent="#B45309" />
            </div>
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary panel */}
                <div data-reveal className="lg:col-span-1">
                  <div className="rounded-2xl p-6 text-white sticky top-[105px]"
                    style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3a7a 100%)' }}>
                    <p className="text-6xl font-black text-center">{avgRating.toFixed(1)}</p>
                    <div className="flex justify-center mt-2"><Stars rating={avgRating} size="lg" /></div>
                    <p className="text-white/55 text-sm text-center mt-2">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                    <div className="mt-6 space-y-2.5">
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-white/50 w-2">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-white/40 w-3 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {/* Review cards */}
                <div data-reveal className="lg:col-span-2 space-y-4">
                  {reviews.map((r, i) => {
                    const name = (r.profiles as any)?.full_name ?? 'Anonymous Buyer'
                    const color = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EC4899','#14B8A6'][i % 6]
                    const initials = name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()
                    return (
                      <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm"
                            style={{ background: color }}>{initials}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{name}</p>
                                <Stars rating={r.rating} />
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {r.verified_purchase && (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />{t('brand.verified_purchase')}
                                  </span>
                                )}
                                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                            {r.supplier_reply && (
                              <div className="mt-3 bg-blue-50 rounded-xl p-3.5 border-l-4 border-[#0B1F4D]">
                                <p className="text-xs font-bold text-[#0B1F4D] mb-1 flex items-center gap-1.5">
                                  <Reply className="w-3.5 h-3.5" />{t('brand.supplier_reply')}
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
              <div data-reveal className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Star className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No reviews yet — be the first to review!</p>
              </div>
            )}
          </section>
        )}

        {/* ══════════════ LOCATIONS ═══════════════════════════════════════════ */}
        {pos.length > 0 && (
          <section id="sec-locations">
            <div data-reveal>
              <SectionHeading icon={MapPin} title={t('brand.locations_title')}
                subtitle={`${pos.length} ${t('brand.locations_sub')}`}
                accent="#065F46" />
            </div>
            <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pos.map((p: any) => {
                const loc  = p.pos_locations as any
                const det  = p.pos_details  as any
                const priv = p.pos_private_details as any   // wholesale-only contact
                const cfg  = POS_TYPE_CONFIG[p.type] ?? { label: p.type, color: 'text-gray-700', bg: 'bg-gray-100', Icon: MapPin }
                const TypeIcon  = cfg.Icon
                const isOpen    = p.status === 'active'
                const isClient  = p.type === 'client_store'
                const shopActive = p.shop_active === true
                const shopSlug   = p.shop_slug as string | null

                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Status + type header */}
                    <div className={`px-4 py-2.5 flex items-center justify-between ${isOpen ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${isOpen ? 'text-green-700' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {isOpen ? t('brand.open_store') : p.status.replace('_', ' ')}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />{cfg.label}
                      </span>
                    </div>

                    <div className="p-4">
                      {/* Manager name (if client store) */}
                      {isClient && det?.manager_name && (
                        <p className="text-[11px] font-bold text-[#F5A623] uppercase tracking-widest mb-0.5">
                          {det.manager_name}
                        </p>
                      )}
                      <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>

                      {/* Address */}
                      {(loc?.address_line1 || loc?.city) && (
                        <p className="text-sm text-gray-500 flex items-start gap-1.5 mb-3">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                          {[loc.address_line1, loc.city, loc.region, loc.country].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Services */}
                      {det?.services_offered?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(det.services_offered as string[]).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      )}

                      {/* Wholesale-only contact — shown only when authenticated */}
                      {isClient && (
                        <div className="mb-3">
                          {isAuthenticated && priv?.phone ? (
                            <a href={`tel:${priv.phone}`}
                              className="flex items-center gap-2 text-sm font-bold text-[#0B1F4D] hover:text-blue-700 transition-colors">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              {priv.phone}
                            </a>
                          ) : !isAuthenticated ? (
                            <Link href="/login"
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0B1F4D] transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              {t('brand.login_to_see')}
                            </Link>
                          ) : null}
                        </div>
                      )}

                      {/* Online Shop badge — core feature */}
                      {isClient && (
                        <div className="mb-3">
                          {shopActive && shopSlug ? (
                            <Link href={`/shop/${shopSlug}`}
                              className="flex items-center gap-2 w-full bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] text-white py-2.5 px-4 rounded-xl text-xs font-extrabold hover:opacity-90 transition-opacity shadow-sm">
                              <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="flex-1">{t('brand.shop_online')}</span>
                              <span className="bg-green-400 text-green-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">{t('brand.shop_active')}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 w-full bg-gray-50 border border-dashed border-gray-200 text-gray-400 py-2.5 px-4 rounded-xl text-xs font-semibold">
                              <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="flex-1">{t('brand.shop_online')}</span>
                              <span className="bg-gray-100 text-gray-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">{t('brand.shop_soon')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-1">
                        {det?.whatsapp && (
                          <a href={`https://wa.me/${det.whatsapp.replace(/\D/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-500 hover:text-white py-2 rounded-xl text-xs font-bold transition-all">
                            <WaIcon className="w-3.5 h-3.5" />WhatsApp
                          </a>
                        )}
                        {loc?.latitude && loc?.longitude && (
                          <a href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 hover:bg-[#0B1F4D] hover:text-white hover:border-transparent py-2 rounded-xl text-xs font-bold transition-all">
                            <Navigation className="w-3.5 h-3.5" />{t('common.map_nav')}
                          </a>
                        )}
                        {!loc?.latitude && (
                          <Link href={`/brand/${brandSlug}/pos/${p.id}`}
                            className="flex-1 flex items-center justify-center gap-1 bg-[#0B1F4D] text-white hover:bg-[#162d6e] py-2 rounded-xl text-xs font-bold transition-colors">
                            {t('common.details')} <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ══════════════ CONTACT ═════════════════════════════════════════════ */}
        <section id="sec-contact">
          <div data-reveal>
            <SectionHeading icon={MessageCircle} title={t('brand.contact_title')}
              subtitle={t('brand.contact_sub')}
              accent="#0E7490" />
          </div>
          <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Contact methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm space-y-5" style={{ borderLeft: '4px solid #0E7490' }}>
              <h3 className="font-extrabold text-[#0B1F4D] text-base">{t('brand.contact_details')}</h3>
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
            {/* Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm space-y-5" style={{ borderLeft: '4px solid #EF4444' }}>
              <h3 className="font-extrabold text-[#0B1F4D] text-base">{t('brand.address')}</h3>
              {(supplier.address_line1 || city || country) && (
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {supplier.address_line1 && <p className="font-semibold text-gray-800">{supplier.address_line1}</p>}
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
                    <Navigation className="w-4 h-4" />{t('brand.open_maps')}
                  </a>
                )}
                {supplier.website && (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all">
                    <ExternalLink className="w-4 h-4" />{t('brand.visit_site')}
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
                ? <video src={lightbox.url} controls className="w-full h-full" autoPlay />
                : <Image src={lightbox.url} alt={lightbox.caption ?? ''} fill className="object-contain" sizes="100vw" />
              }
            </div>
            {lightbox.caption && <p className="text-center text-white/70 text-sm mt-4 font-medium">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </>
  )
}
