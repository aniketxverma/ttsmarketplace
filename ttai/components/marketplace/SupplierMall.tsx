'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, X, MapPin, ShieldCheck, Package, Store, ArrowRight, Clock } from 'lucide-react'
import { QuoteButton } from '@/components/shared/QuoteButton'

export type SupProduct = { slug: string; name: string; img: string; price: string }
export type MallSupplier = {
  id: string; name: string; tagline: string | null; logo: string | null; banner: string | null
  country: string | null; city: string | null; tier: string | null; brandSlug: string | null
  whatsapp: string | null; years: number | null; count: number; kindLabel: string; premium: boolean
  products: SupProduct[]
}

function Storefront({ s, onOpen, wide = false }: { s: MallSupplier; onOpen: (s: MallSupplier) => void; wide?: boolean }) {
  const initials = s.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`group relative rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${wide ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
      {s.premium && <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold px-2 py-0.5 shadow">★ Featured</span>}
      {/* Storefront image */}
      <button onClick={() => onOpen(s)} className={`relative block w-full ${wide ? 'h-44' : 'h-32'} overflow-hidden text-left`}>
        {s.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.banner} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {/* moving blue sheen */}
        <span className="pointer-events-none absolute -inset-x-1/2 inset-y-0 bg-gradient-to-r from-transparent via-blue-300/15 to-transparent animate-[shimmer_6s_linear_infinite]" />
        <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl border-2 border-white shadow bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
            {s.logo ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={s.logo} alt="" className="w-full h-full object-cover" />) : <span className="text-[#0B1F4D] font-black text-xs">{initials}</span>}
          </span>
          <span className="text-white font-extrabold text-sm drop-shadow">{s.name}</span>
        </div>
      </button>
      <div className="p-3.5">
        <div className="flex items-center gap-2 text-[11px] mb-2">
          <span className="inline-flex items-center gap-1 font-bold text-green-600"><ShieldCheck className="w-3.5 h-3.5" />{s.tier === 'GOLD' ? 'Gold Verified' : 'Verified'}</span>
          {(s.city || s.country) && <span className="inline-flex items-center gap-0.5 text-gray-400"><MapPin className="w-3 h-3" />{[s.city, s.country].filter(Boolean).join(', ')}</span>}
          {s.count > 0 && <span className="ml-auto font-bold text-[#0B1F4D]">{s.count} products</span>}
        </div>
        {/* product window */}
        <div className={`grid ${wide ? 'grid-cols-6' : 'grid-cols-4'} gap-1.5 mb-3`}>
          {Array.from({ length: wide ? 6 : 4 }).map((_, i) => {
            const t = s.products[i]
            return (
              <div key={i} className="aspect-square rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                {t?.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={t.img} alt="" className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />) : <Package className="w-4 h-4 text-gray-200" />}
              </div>
            )
          })}
        </div>
        <button onClick={() => onOpen(s)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-xs font-bold py-2 transition-colors">
          <Store className="w-3.5 h-3.5" /> Visit storefront
        </button>
      </div>
    </div>
  )
}

function SupplierDrawer({ s, onClose }: { s: MallSupplier; onClose: () => void }) {
  const initials = s.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${s.name}, I'm interested in your products on TTAI EMA.`)}` : null
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        <div className="relative h-44">
          {s.banner ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={s.banner} alt={s.name} className="w-full h-full object-cover" />) : <div className="w-full h-full bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 -mt-10 mb-2">
            <div className="w-16 h-16 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
              {s.logo ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={s.logo} alt="" className="w-full h-full object-cover" />) : <span className="text-[#0B1F4D] font-black">{initials}</span>}
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">{s.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {s.premium && <span className="rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-bold">Featured</span>}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><ShieldCheck className="w-3.5 h-3.5" />{s.tier === 'GOLD' ? 'Gold Verified' : 'Verified'}</span>
            {(s.city || s.country) && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5" />{[s.city, s.country].filter(Boolean).join(', ')}</span>}
          </div>
          {s.tagline && <p className="text-sm text-gray-500 mt-2">{s.tagline}</p>}

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[{ Icon: Package, v: s.count, l: 'Products' }, { Icon: Clock, v: s.years ? `${s.years}y` : '—', l: 'Experience' }, { Icon: Star, v: s.tier === 'GOLD' ? 'Gold' : 'Verified', l: 'Trust' }].map((f) => (
              <div key={f.l} className="rounded-xl border border-gray-200 p-2 text-center">
                <f.Icon className="w-4 h-4 mx-auto text-[#0B1F4D]" /><p className="text-xs font-bold text-gray-800 mt-1">{f.v}</p><p className="text-[9px] text-gray-400">{f.l}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Link href={`/marketplace?supplier=${s.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white font-extrabold py-2.5 text-sm hover:bg-[#162d6e] transition-colors"><Store className="w-4 h-4" />Enter Shop</Link>
            <QuoteButton company={s.name} whatsapp={s.whatsapp} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] font-extrabold py-2.5 text-sm hover:bg-[#fbb93a] transition-colors" />
          </div>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center rounded-xl border border-green-200 text-green-600 font-bold py-2.5 text-sm hover:bg-green-50 transition-colors">Chat on WhatsApp</a>}

          {s.products.length > 0 && (
            <>
              <p className="text-sm font-extrabold text-gray-900 mt-5 mb-2">Products</p>
              <div className="overflow-hidden">
                <div className="flex gap-2 w-max animate-marquee" style={{ animationDuration: `${Math.max(16, s.products.length * 3.5)}s` }}>
                  {[...s.products, ...s.products].map((p, i) => (
                    <Link key={i} href={`/product/${p.slug}`} className="flex-shrink-0 w-24">
                      <div className="w-24 h-24 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                        {p.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.img} alt={p.name} className="w-full h-full object-contain p-1" />) : <Package className="w-5 h-5 text-gray-200" />}
                      </div>
                      <p className="text-[10px] text-gray-600 line-clamp-2 mt-1 leading-tight">{p.name}</p>
                      <p className="text-[11px] font-extrabold text-[#0B1F4D]">{p.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {s.brandSlug && <Link href={`/brand/${s.brandSlug}`} className="mt-5 block text-center text-xs font-bold text-[#0B1F4D] hover:underline">View full company profile →</Link>}
        </div>
      </div>
    </div>
  )
}

export function SupplierMall({ suppliers }: { suppliers: MallSupplier[] }) {
  const [open, setOpen] = useState<MallSupplier | null>(null)
  if (!suppliers.length) return null
  const [featured, ...rest] = suppliers
  return (
    <div className="space-y-5">
      <Storefront s={featured} onOpen={setOpen} wide />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rest.map((s) => <Storefront key={s.id} s={s} onOpen={setOpen} />)}
      </div>
      {open && <SupplierDrawer s={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
