'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Star, ChevronLeft, ChevronRight, X, MapPin, Truck, ShoppingBag,
  Package, Store, ShieldCheck, Clock, Search,
} from 'lucide-react'
import { FavButton } from '@/components/shared/FavButton'

export type MallProduct = { name: string; price: string; img: string }
export type MallStore = {
  id: string
  name: string
  href: string
  premium: boolean
  rating: string
  reviews: number
  location: string
  about: string | null
  whatsapp: string | null
  image: string
  hours: string
  minOrder: string
  products: MallProduct[]
  productCount: number
}
export type MallGroup = { category: string; accent: string; stores: MallStore[] }

const ACTIONS = [
  { Icon: Truck, label: 'Delivery', sub: '30–60 min' },
  { Icon: ShoppingBag, label: 'Take Away', sub: 'Ready in 20 min' },
  { Icon: Package, label: 'Min. Order', sub: '' },
  { Icon: Truck, label: 'Shipping', sub: '€2.90' },
  { Icon: ShieldCheck, label: 'Pay', sub: 'Secure' },
]

function StoreCard({ s, onOpen }: { s: MallStore; onOpen: (s: MallStore) => void }) {
  return (
    <div className="group relative snap-start flex-shrink-0 w-[280px] rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <FavButton id={s.id} kind="store" className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-rose-500 transition-colors" />
      {/* Storefront photo */}
      <button onClick={() => onOpen(s)} className="relative block w-full h-36 text-left overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/55 backdrop-blur px-2 py-0.5 text-[11px] font-extrabold text-white">{s.name}</span>
        {s.premium && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center rounded-md bg-[#F5A623] px-2 py-0.5 text-[10px] font-extrabold text-[#0B1F4D]">Premium</span>
        )}
      </button>
      <div className="p-3">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="inline-flex items-center gap-1 font-bold text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400" />{s.rating} <span className="text-gray-400 font-medium">({s.reviews})</span></span>
          <span className="inline-flex items-center gap-1 font-bold text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{s.hours}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {s.products.slice(0, 4).map((p, i) => (
            <div key={i} className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
              {p.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.img} alt="" className="w-full h-full object-contain p-0.5" />
              ) : <Store className="w-4 h-4 text-gray-200" />}
            </div>
          ))}
          <button onClick={() => onOpen(s)} className="w-11 h-11 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ g, onOpen }: { g: MallGroup; onOpen: (s: MallStore) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const slide = (d: number) => ref.current?.scrollBy({ left: d * 300, behavior: 'smooth' })
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: g.accent }}><Store className="w-5 h-5" /></span>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">{g.category} Mall</h2>
            <p className="text-xs text-gray-400">Discover the best stores &amp; specialty shops.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => slide(-1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => slide(1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto snap-x pb-1" style={{ scrollbarWidth: 'none' }}>
        {g.stores.map((s) => <StoreCard key={s.id} s={s} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

function StoreDrawer({ s, onClose }: { s: MallStore; onClose: () => void }) {
  const [tab, setTab] = useState<'About' | 'Reviews' | 'Products' | 'Offers' | 'Info'>('About')
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${s.name}, I'd like to order.`)}` : null
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        {/* Storefront image */}
        <div className="relative h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white"><X className="w-4 h-4" /></button>
          <span className="absolute top-3 left-3 inline-flex items-center rounded-md bg-[#1f7a3a] px-2 py-0.5 text-[10px] font-extrabold text-white"><Clock className="w-3 h-3 mr-1" />{s.hours}</span>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-extrabold text-gray-900">{s.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {s.premium && <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-bold">Premium Store</span>}
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400" />{s.rating} <span className="text-gray-400 font-medium">({s.reviews} reviews)</span></span>
          </div>
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5"><MapPin className="w-3.5 h-3.5" />{s.location}</p>

          {/* Action chips */}
          <div className="grid grid-cols-5 gap-1.5 mt-4">
            {ACTIONS.map((a) => (
              <div key={a.label} className="rounded-xl border border-gray-200 p-2 text-center">
                <a.Icon className="w-4 h-4 mx-auto text-[#0B1F4D]" />
                <p className="text-[10px] font-bold text-gray-700 mt-1 leading-tight">{a.label}</p>
                <p className="text-[9px] text-gray-400 leading-tight">{a.label === 'Min. Order' ? s.minOrder : a.sub}</p>
              </div>
            ))}
          </div>

          {/* Top products */}
          <div className="flex items-center justify-between mt-5 mb-2">
            <p className="text-sm font-extrabold text-gray-900">Top Products</p>
            <Link href={s.href} className="text-xs font-bold text-[#0B1F4D] hover:underline">View All ({s.productCount})</Link>
          </div>
          <div className="overflow-hidden">
            <div className="flex gap-2 w-max animate-marquee" style={{ animationDuration: `${Math.max(16, s.products.length * 3.5)}s` }}>
              {[...s.products.slice(0, 8), ...s.products.slice(0, 8)].map((p, i) => (
                <div key={i} className="group/p flex-shrink-0 w-20">
                  <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center group-hover/p:scale-105 transition-transform">
                    {p.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.img} alt={p.name} className="w-full h-full object-contain p-1" />
                    ) : <Store className="w-5 h-5 text-gray-200" />}
                  </div>
                  <p className="text-[10px] text-gray-600 line-clamp-2 mt-1 leading-tight">{p.name}</p>
                  <p className="text-[11px] font-extrabold text-[#0B1F4D]">{p.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-100 mt-5 text-sm">
            {(['About', 'Reviews', 'Products', 'Offers', 'Info'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-2 font-bold transition-colors ${tab === t ? 'text-[#0B1F4D] border-b-2 border-[#0B1F4D]' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
            ))}
          </div>
          <div className="py-4 text-sm text-gray-600 min-h-[90px]">
            {tab === 'About' && (
              <>
                <p className="leading-relaxed">{s.about ?? `${s.name} offers high-quality products with great service.`}</p>
                <ul className="mt-3 space-y-1.5">
                  {['Wide range of products', '100% original and fresh', 'Best quality at the best price', 'Open 24 hours — always here for you'].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span>{b}</li>
                  ))}
                </ul>
              </>
            )}
            {tab === 'Products' && (
              <div className="grid grid-cols-3 gap-2">
                {s.products.slice(0, 9).map((p, i) => (
                  <div key={i} className="text-center">
                    <div className="aspect-square rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                      {p.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.img} alt="" className="w-full h-full object-contain p-1" />) : null}
                    </div>
                    <p className="text-[10px] font-bold text-[#0B1F4D] mt-1">{p.price}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === 'Reviews' && <p className="text-gray-400">⭐ {s.rating} from {s.reviews} verified buyers.</p>}
            {tab === 'Offers' && <p className="text-gray-400">No active promotions right now.</p>}
            {tab === 'Info' && <p className="text-gray-400">{s.location} · Open 24 hours · Secure payments.</p>}
          </div>

          {/* CTAs */}
          <Link href={s.href} className="flex items-center justify-center gap-2 rounded-xl bg-[#1f7a3a] hover:bg-[#1a6a32] text-white font-extrabold py-3 text-sm transition-colors">
            <Store className="w-4 h-4" /> Enter Store
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-700 font-bold py-3 text-sm mt-2 hover:border-green-500 hover:text-green-600 transition-colors">
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function MallShops({ groups }: { groups: MallGroup[] }) {
  const [open, setOpen] = useState<MallStore | null>(null)
  const [q, setQ] = useState('')
  if (!groups.length) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-12 text-center text-gray-400">
        <Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No stores open in this area yet.</p>
      </div>
    )
  }
  const query = q.toLowerCase().trim()
  const matches = query ? groups.flatMap((g) => g.stores).filter((s) => s.name.toLowerCase().includes(query)) : null
  return (
    <div className="space-y-5">
      {/* Store search */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-2.5 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stores in the mall…" className="flex-1 bg-transparent text-sm focus:outline-none" />
        {q && <button onClick={() => setQ('')} className="text-xs font-bold text-[#0B1F4D] hover:underline mr-2">Clear</button>}
      </div>

      {matches ? (
        matches.length ? (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-500 mb-4">{matches.length} store{matches.length !== 1 ? 's' : ''} matching &quot;{q}&quot;</p>
            <div className="flex flex-wrap gap-4">{matches.map((s) => <StoreCard key={s.id} s={s} onOpen={setOpen} />)}</div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-12 text-center text-gray-400"><Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No stores match &quot;{q}&quot;.</p></div>
        )
      ) : (
        groups.map((g) => <Row key={g.category} g={g} onOpen={setOpen} />)
      )}
      {open && <StoreDrawer s={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
