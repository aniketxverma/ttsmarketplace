'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCents } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Supplier {
  id: string
  trade_name: string | null
  legal_name: string | null
  brand_slug: string | null
  description: string | null
  about_company: string | null
  founded_year: number | null
  website: string | null
  phone: string | null
  whatsapp: string | null
  business_email: string | null
  working_hours: string | null
  google_map_link: string | null
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  twitter: string | null
  youtube: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  countries?: { name: string; iso_code: string } | null
  cities?: { name: string } | null
}

interface Product {
  id: string
  name: string
  slug: string
  price_cents: number
  currency_code: string
  min_order_qty: number | null
  thumb: string | null
  category_name: string | null
}

interface GalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  caption: string | null
  sort_order: number
}

interface Certification {
  id: string
  title: string
  issuer: string | null
  issued_date: string | null
  expiry_date: string | null
  image_url: string | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  verified_purchase: boolean
  supplier_reply: string | null
  created_at: string
  profiles: { full_name: string | null } | null
}

interface Document {
  id: string
  doc_type: string
  file_url: string
  uploaded_at: string
}

interface Props {
  supplier: Supplier
  products: Product[]
  gallery: GalleryItem[]
  certifications: Certification[]
  reviews: Review[]
  documents: Document[]
  avgRating: number
  sectionVisibility: Record<string, boolean>
  pos: any[]
  brandSlug: string
}

// ── Tab config ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',         label: 'Overview' },
  { id: 'products',         label: 'Products' },
  { id: 'gallery',          label: 'Gallery' },
  { id: 'certifications',   label: 'Certifications' },
  { id: 'reviews',          label: 'Reviews' },
  { id: 'pos',              label: 'Locations' },
  { id: 'contact',          label: 'Contact' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ supplier }: { supplier: Supplier }) {
  const hasAbout = !!(supplier.about_company || supplier.description)
  return (
    <div className="space-y-6">
      {hasAbout && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0B1F4D] mb-3">About Us</h2>
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
            {supplier.about_company ?? supplier.description}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {supplier.founded_year && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Founded</p>
              <p className="text-base font-bold text-[#0B1F4D]">{supplier.founded_year}</p>
            </div>
          </div>
        )}
        {supplier.countries && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Location</p>
              <p className="text-base font-bold text-[#0B1F4D]">
                {supplier.cities ? `${(supplier.cities as any).name}, ` : ''}{(supplier.countries as any).name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Social links if any */}
      {(supplier.instagram || supplier.facebook || supplier.linkedin || supplier.twitter || supplier.youtube) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Follow Us</h3>
          <div className="flex flex-wrap gap-3">
            {supplier.instagram && (
              <a href={supplier.instagram} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
            )}
            {supplier.facebook && (
              <a href={supplier.facebook} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            )}
            {supplier.linkedin && (
              <a href={supplier.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {supplier.twitter && (
              <a href={supplier.twitter} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-sky-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter / X
              </a>
            )}
            {supplier.youtube && (
              <a href={supplier.youtube} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-gray-400 font-medium">No products listed yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <Link key={p.id} href={`/products/${p.slug}`}
          className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="relative aspect-square bg-gray-50">
            {p.thumb ? (
              <Image src={p.thumb} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-3">
            {p.category_name && (
              <p className="text-xs text-gray-400 font-medium mb-0.5">{p.category_name}</p>
            )}
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{p.name}</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-[#0B1F4D]">
                {formatCents(p.price_cents, p.currency_code)}
              </span>
              {p.min_order_qty && (
                <span className="text-xs text-gray-400">MOQ: {p.min_order_qty}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Gallery Tab ───────────────────────────────────────────────────────────────
function GalleryTab({ gallery }: { gallery: GalleryItem[] }) {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  if (gallery.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400 font-medium">No gallery images yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {gallery.map((item) => (
          <button key={item.id} onClick={() => setLightbox(item)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-[#0B1F4D] transition-all">
            {item.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <Image src={item.url} alt={item.caption ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />
            )}
            {item.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform">
                {item.caption}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors" onClick={() => setLightbox(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-4xl max-h-[80vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              {lightbox.type === 'video' ? (
                <video src={lightbox.url} controls className="w-full h-full rounded-xl" />
              ) : (
                <Image src={lightbox.url} alt={lightbox.caption ?? ''} fill className="object-contain rounded-xl" sizes="100vw" />
              )}
            </div>
            {lightbox.caption && (
              <p className="text-center text-white/80 text-sm mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Certifications Tab ────────────────────────────────────────────────────────
function CertificationsTab({ certifications, documents }: { certifications: Certification[]; documents: Document[] }) {
  return (
    <div className="space-y-6">
      {certifications.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#0B1F4D] mb-3">Certifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-3">
                {cert.image_url ? (
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                    <Image src={cert.image_url} alt={cert.title} fill className="object-contain p-1" sizes="56px" />
                  </div>
                ) : (
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{cert.title}</p>
                  {cert.issuer && <p className="text-xs text-gray-400 mt-0.5">{cert.issuer}</p>}
                  {(cert.issued_date || cert.expiry_date) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {cert.issued_date && new Date(cert.issued_date).getFullYear()}
                      {cert.issued_date && cert.expiry_date && ' – '}
                      {cert.expiry_date && new Date(cert.expiry_date).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#0B1F4D] mb-3">Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0B1F4D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {certifications.length === 0 && documents.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p className="text-gray-400 font-medium">No certifications added yet</p>
        </div>
      )}
    </div>
  )
}

// ── Reviews Tab ───────────────────────────────────────────────────────────────
function ReviewsTab({ reviews, avgRating }: { reviews: Review[]; avgRating: number }) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <p className="text-gray-400 font-medium">No reviews yet</p>
      </div>
    )
  }

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="text-center flex-shrink-0">
            <p className="text-5xl font-extrabold text-[#0B1F4D]">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} />
            <p className="text-sm text-gray-400 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {dist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-4">{star}</span>
                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((r) => {
          const reviewer = r.profiles as any as { full_name: string | null } | null
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{reviewer?.full_name ?? 'Anonymous'}</p>
                  <StarRating rating={r.rating} />
                </div>
                <div className="text-right flex-shrink-0">
                  {r.verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
              {r.supplier_reply && (
                <div className="mt-3 pl-4 border-l-2 border-[#0B1F4D]/20 bg-blue-50 rounded-r-xl p-3">
                  <p className="text-xs font-semibold text-[#0B1F4D] mb-1">Supplier Reply</p>
                  <p className="text-sm text-gray-600">{r.supplier_reply}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── POS Tab ───────────────────────────────────────────────────────────────────
const POS_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  shop:         { label: 'Retail Shop',    color: 'bg-blue-100 text-blue-700' },
  warehouse:    { label: 'Warehouse',      color: 'bg-gray-100 text-gray-700' },
  distributor:  { label: 'Distributor',    color: 'bg-amber-100 text-amber-700' },
  pickup_point: { label: 'Pickup Point',   color: 'bg-green-100 text-green-700' },
  franchise:    { label: 'Franchise',      color: 'bg-purple-100 text-purple-700' },
  client_store: { label: 'Client Store',   color: 'bg-pink-100 text-pink-700' },
  agent_office: { label: 'Agent Office',   color: 'bg-indigo-100 text-indigo-700' },
  export_hub:   { label: 'Export Hub',     color: 'bg-teal-100 text-teal-700' },
}

const POS_STATUS_COLORS: Record<string, string> = {
  active:             'bg-green-100 text-green-700',
  temporarily_closed: 'bg-yellow-100 text-yellow-700',
  closed:             'bg-red-100 text-red-700',
}

function PosTab({ pos, brandSlug }: { pos: any[]; brandSlug: string }) {
  if (pos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-gray-400 font-medium">No locations listed</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pos.map((p) => {
        const loc = p.pos_locations as any
        const det = p.pos_details as any
        const typeInfo = POS_TYPE_LABELS[p.type] ?? { label: p.type, color: 'bg-gray-100 text-gray-700' }
        const statusColor = POS_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'
        return (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{p.status.replace('_', ' ')}</span>
                </div>
                {(loc?.address_line1 || loc?.city) && (
                  <p className="text-sm text-gray-500 mb-2">
                    {[loc.address_line1, loc.city, loc.country].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  {det?.phone && (
                    <a href={`tel:${det.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#0B1F4D] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {det.phone}
                    </a>
                  )}
                  {det?.whatsapp && (
                    <a href={`https://wa.me/${det.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  )}
                </div>
                {det?.services_offered?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(det.services_offered as string[]).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/brand/${brandSlug}/pos/${p.id}`}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl border border-[#0B1F4D] text-[#0B1F4D] text-xs font-bold hover:bg-[#0B1F4D] hover:text-white transition-all whitespace-nowrap">
                View Details
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Contact Tab ───────────────────────────────────────────────────────────────
function ContactTab({ supplier }: { supplier: Supplier }) {
  const country = supplier.countries as any as { name: string } | null
  const city    = supplier.cities   as any as { name: string } | null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Contact info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#0B1F4D]">Contact Info</h3>

        {supplier.phone && (
          <a href={`tel:${supplier.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0B1F4D] transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B1F4D] transition-colors">
              <svg className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            {supplier.phone}
          </a>
        )}
        {supplier.whatsapp && (
          <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
              <svg className="w-4 h-4 text-green-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            {supplier.whatsapp}
          </a>
        )}
        {supplier.business_email && (
          <a href={`mailto:${supplier.business_email}`}
            className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0B1F4D] transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B1F4D] transition-colors">
              <svg className="w-4 h-4 text-purple-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {supplier.business_email}
          </a>
        )}
        {supplier.website && (
          <a href={supplier.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#0B1F4D] transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B1F4D] transition-colors">
              <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            {supplier.website}
          </a>
        )}

        {/* Working hours */}
        {supplier.working_hours && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Working Hours</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{supplier.working_hours}</p>
            </div>
          </div>
        )}
      </div>

      {/* Address + Map */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#0B1F4D]">Location</h3>
        {(supplier.address_line1 || city || country) && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              {supplier.address_line1 && <p>{supplier.address_line1}</p>}
              {supplier.address_line2 && <p>{supplier.address_line2}</p>}
              {(city || country) && (
                <p>{city ? `${(city as any).name}, ` : ''}{country ? (country as any).name : ''} {supplier.postal_code ?? ''}</p>
              )}
            </div>
          </div>
        )}
        {supplier.google_map_link && (
          <a href={supplier.google_map_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View on Google Maps
          </a>
        )}
      </div>
    </div>
  )
}

// ── Main BrandTabs component ──────────────────────────────────────────────────
export function BrandTabs({
  supplier,
  products,
  gallery,
  certifications,
  reviews,
  documents,
  avgRating,
  sectionVisibility,
  pos,
  brandSlug,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview')

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'gallery'       && sectionVisibility.gallery       === false) return false
    if (tab.id === 'certifications' && sectionVisibility.certifications === false) return false
    if (tab.id === 'reviews'       && sectionVisibility.reviews        === false) return false
    if (tab.id === 'pos'           && pos.length === 0) return false
    return true
  })

  return (
    <div>
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-20 bg-gray-50 pb-0">
        <div className="flex overflow-x-auto gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm mb-4 scrollbar-none">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0B1F4D] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.id === 'products' && products.length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'products' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {products.length}
                </span>
              )}
              {tab.id === 'reviews' && reviews.length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'reviews' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {reviews.length}
                </span>
              )}
              {tab.id === 'pos' && pos.length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'pos' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {pos.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview'       && <OverviewTab supplier={supplier} />}
      {activeTab === 'products'       && <ProductsTab products={products} />}
      {activeTab === 'gallery'        && <GalleryTab gallery={gallery} />}
      {activeTab === 'certifications' && <CertificationsTab certifications={certifications} documents={documents} />}
      {activeTab === 'reviews'        && <ReviewsTab reviews={reviews} avgRating={avgRating} />}
      {activeTab === 'pos'            && <PosTab pos={pos} brandSlug={brandSlug} />}
      {activeTab === 'contact'        && <ContactTab supplier={supplier} />}
    </div>
  )
}
