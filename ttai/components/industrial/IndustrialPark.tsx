'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Star, X, MapPin, Info, Search, ChevronDown, ShieldCheck,
  Calendar, Users, Package, Globe, Share2, Bookmark, Factory, Quote,
} from 'lucide-react'
import { QuoteModal } from '@/components/shared/QuoteModal'
import { FavButton } from '@/components/shared/FavButton'
import { useAuthGate } from '@/components/shared/AuthGate'

export type CompanyProduct = { name: string; price: string; img: string }
export type Company = {
  id: string
  name: string
  href: string
  category: string
  premium: boolean
  rating: string
  reviews: number
  location: string
  founded: string
  employees: string
  moq: string
  exportTo: string
  about: string | null
  whatsapp: string | null
  website: string | null
  image: string
  products: CompanyProduct[]
  productCount: number
}

const PIN_POS = [
  { top: '30%', left: '24%' }, { top: '34%', left: '47%' }, { top: '30%', left: '70%' },
  { top: '55%', left: '32%' }, { top: '56%', left: '55%' }, { top: '54%', left: '76%' },
]

function WarehouseCard({ c, onOpen }: { c: Company; onOpen: (c: Company) => void }) {
  return (
    <div className="group relative rounded-xl bg-white border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <FavButton id={c.id} kind="company" className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-rose-500" />
      <button onClick={() => onOpen(c)} className="relative block w-full h-28 overflow-hidden text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {c.premium && <span className="absolute bottom-2 left-2 rounded bg-[#F5A623] px-1.5 py-0.5 text-[9px] font-extrabold text-[#0B1F4D]">Premium</span>}
      </button>
      <div className="p-3">
        <p className="font-extrabold text-gray-900 text-sm truncate">{c.name}</p>
        <p className="text-[11px] text-gray-400 truncate">{c.category}</p>
        <div className="flex items-center gap-2 text-[11px] my-2">
          <span className="inline-flex items-center gap-1 font-bold text-amber-500"><Star className="w-3 h-3 fill-amber-400" />{c.rating} <span className="text-gray-400 font-medium">({c.reviews})</span></span>
          <span className="inline-flex items-center gap-1 font-bold text-green-600"><ShieldCheck className="w-3 h-3" />Verified</span>
        </div>
        <div className="flex items-center gap-1 mb-2.5">
          {c.products.slice(0, 3).map((p, i) => (
            <div key={i} className="w-9 h-9 rounded-md bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
              {p.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.img} alt="" className="w-full h-full object-contain p-0.5" />) : <Package className="w-3.5 h-3.5 text-gray-200" />}
            </div>
          ))}
        </div>
        <button onClick={() => onOpen(c)} className="block w-full text-center rounded-lg bg-[#1f7a3a] hover:bg-[#1a6a32] text-white text-xs font-bold py-2 transition-colors">View Company</button>
      </div>
    </div>
  )
}

function CompanyDrawer({ c, onClose }: { c: Company; onClose: () => void }) {
  const [tab, setTab] = useState<'About Us' | 'Certificates' | 'Company Info' | 'Gallery'>('About Us')
  const [quote, setQuote] = useState(false)
  const { gate, modal } = useAuthGate({ title: 'Sign in to contact suppliers', subtitle: 'Browsing is open to everyone — registered B2B buyers can request quotes and chat with suppliers.' })
  const wa = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${c.name}, I'd like a quotation.`)}` : null
  const facts = [
    { Icon: Calendar, label: 'Year Established', val: c.founded },
    { Icon: Users, label: 'Employees', val: c.employees },
    { Icon: Package, label: 'MOQ', val: c.moq },
    { Icon: Globe, label: 'Export to', val: c.exportTo },
  ]
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        <div className="relative h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 -mt-10 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-[#0B1F4D] border-4 border-white flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">{c.name.slice(0, 2).toUpperCase()}</div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">{c.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {c.premium && <span className="rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-bold">Premium Supplier</span>}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><ShieldCheck className="w-3.5 h-3.5" />Verified</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{c.category}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1"><MapPin className="w-3.5 h-3.5" />{c.location}</p>

          {/* Facts */}
          <div className="grid grid-cols-4 gap-1.5 mt-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl border border-gray-200 p-2 text-center">
                <f.Icon className="w-4 h-4 mx-auto text-[#0B1F4D]" />
                <p className="text-[10px] font-bold text-gray-800 mt-1 leading-tight">{f.val}</p>
                <p className="text-[8px] text-gray-400 leading-tight">{f.label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => gate(() => setQuote(true))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f7a3a] hover:bg-[#1a6a32] text-white font-extrabold py-2.5 text-sm transition-colors"><Quote className="w-4 h-4" />Request a Quote</button>
            {wa ? (
              <button onClick={() => gate(() => window.open(wa, '_blank', 'noopener'))} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-700 font-bold py-2.5 text-sm hover:border-green-500 hover:text-green-600 transition-colors">Chat on WhatsApp</button>
            ) : <span />}
          </div>
          <QuoteModal open={quote} onClose={() => setQuote(false)} company={c.name} whatsapp={c.whatsapp} />
          {modal}


          {/* Featured products */}
          <div className="flex items-center justify-between mt-5 mb-2">
            <p className="text-sm font-extrabold text-gray-900">Featured Products</p>
            <Link href={c.href} className="text-xs font-bold text-[#0B1F4D] hover:underline">View All ({c.productCount})</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {c.products.slice(0, 6).map((p, i) => (
              <div key={i} className="flex-shrink-0 w-[74px]">
                <div className="w-[74px] h-[74px] rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                  {p.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.img} alt={p.name} className="w-full h-full object-contain p-1" />) : <Package className="w-5 h-5 text-gray-200" />}
                </div>
                <p className="text-[10px] text-gray-600 line-clamp-2 mt-1 leading-tight">{p.name}</p>
                <p className="text-[11px] font-extrabold text-[#0B1F4D]">{p.price}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-100 mt-5 text-sm overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {(['About Us', 'Certificates', 'Company Info', 'Gallery'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pb-2 font-bold whitespace-nowrap transition-colors ${tab === t ? 'text-[#0B1F4D] border-b-2 border-[#0B1F4D]' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
            ))}
          </div>
          <div className="py-4 text-sm text-gray-600 min-h-[90px]">
            {tab === 'About Us' && (
              <>
                <p className="leading-relaxed">{c.about ?? `${c.name} is a leading wholesale supplier offering competitive prices, reliable quality and worldwide shipping.`}</p>
                <ul className="mt-3 space-y-1.5">
                  {['Wide range of products', 'Competitive wholesale prices', 'Fast delivery & safe packaging', 'Professional after-sales support'].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span>{b}</li>
                  ))}
                </ul>
              </>
            )}
            {tab === 'Certificates' && <p className="text-gray-400">ISO &amp; trade certificates available on request.</p>}
            {tab === 'Company Info' && <p className="text-gray-400">{c.category} · {c.location} · Est. {c.founded} · {c.employees} employees · Exports to {c.exportTo}.</p>}
            {tab === 'Gallery' && (
              <div className="grid grid-cols-3 gap-2">{c.products.slice(0, 6).map((p, i) => (<div key={i} className="aspect-square rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">{p.img ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.img} alt="" className="w-full h-full object-contain p-1" />) : null}</div>))}</div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs font-bold text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" />Save Supplier</span>
            <span className="inline-flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" />Share</span>
            {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#0B1F4D]"><Globe className="w-3.5 h-3.5" />Visit Website</a> : <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Visit Website</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function IndustrialPark({ parkName, parkArea, companyCount, companies }: {
  parkName: string; parkArea: string; companyCount: number; companies: Company[]
}) {
  const [open, setOpen] = useState<Company | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const allCategories = Array.from(new Set(companies.map((c) => c.category))).sort()
  const filtered = companies.filter((c) =>
    (!q || `${c.name} ${c.category}`.toLowerCase().includes(q.toLowerCase().trim())) && (!cat || c.category === cat))
  const pinned = filtered.slice(0, 6)
  return (
    <div className="space-y-5">
      {/* Park header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            {parkName}
            <span className="rounded-full bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5">{companyCount} Companies</span>
          </h2>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5"><MapPin className="w-3.5 h-3.5 text-[#F5A623]" />{parkArea}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-[#0B1F4D] transition-colors"><Info className="w-4 h-4" />View Park Information</button>
      </div>

      {/* Aerial park with company pins */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="relative aspect-[16/8] sm:aspect-[16/6] min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1600&q=80" alt={parkName} className="w-full h-full object-cover animate-mall-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {pinned.map((c, i) => {
            const pos = PIN_POS[i]
            return (
              <button key={c.id} onClick={() => setOpen(c)}
                className="group absolute -translate-x-1/2 -translate-y-full animate-mall-float" style={{ top: pos.top, left: pos.left, animationDelay: `${(i % 4) * 0.5}s` }}>
                <span className="flex items-center gap-1.5 rounded-lg bg-white shadow-lg px-2 py-1 group-hover:scale-105 transition-transform">
                  <span className="w-5 h-5 rounded bg-[#0B1F4D] text-white text-[9px] font-black flex items-center justify-center">{c.name.slice(0, 2).toUpperCase()}</span>
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] font-extrabold text-gray-900">{c.name}</span>
                    <span className="block text-[8px] text-gray-400">{c.category}</span>
                  </span>
                </span>
                <span className="block w-2.5 h-2.5 rounded-full bg-[#1f7a3a] ring-2 ring-white mx-auto -mt-0.5 shadow" />
              </button>
            )
          })}
        </div>
        {/* search / filter bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white border-t border-gray-100">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies in this park…" className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B1F4D]/50" />
          </div>
          <div className="relative">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="appearance-none rounded-lg border border-gray-200 pl-3 pr-8 py-2 text-sm font-semibold text-gray-600 bg-white focus:outline-none focus:border-[#0B1F4D]/50">
              <option value="">All Categories</option>
              {allCategories.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {(q || cat) && <button onClick={() => { setQ(''); setCat('') }} className="text-xs font-bold text-[#0B1F4D] hover:underline">Clear</button>}
        </div>
      </div>

      {/* Company grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center text-gray-400"><Factory className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">{companies.length ? 'No companies match your search.' : 'No companies registered in this park yet.'}</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {filtered.map((c) => <WarehouseCard key={c.id} c={c} onOpen={setOpen} />)}
          </div>
          <div className="text-center">
            <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-sm font-bold px-6 py-2.5 transition-colors">View All Companies in this Park</Link>
          </div>
        </>
      )}

      {open && <CompanyDrawer c={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
