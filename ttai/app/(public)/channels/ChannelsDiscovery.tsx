'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio, Users, FileText, ArrowRight, Search, Bell, Tag, Package, Megaphone, Crown,
} from 'lucide-react'

type Supplier = { trade_name: string | null; legal_name: string | null; logo_url: string | null; brand_slug: string | null; reliability_tier: string | null }
type Post = { content: string; image_url: string | null; post_type: string; created_at: string }
export type DiscoveryChannel = {
  id: string; name: string; description: string | null
  member_count: number; post_count: number; category: string
  supplier: Supplier | null; latest: Post | null
}

const TYPE: Record<string, { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',    Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700',  Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700',Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700',  Icon: Megaphone },
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect() } }, { threshold: 0.1, rootMargin: '-20px' })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

export function ChannelsDiscovery({ channels }: { channels: DiscoveryChannel[] }) {
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>()
    channels.forEach(c => set.add(c.category))
    return ['All', ...Array.from(set).sort()]
  }, [channels])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return channels.filter(c =>
      (active === 'All' || c.category === active) &&
      (!q || c.name.toLowerCase().includes(q) || (c.supplier?.trade_name ?? '').toLowerCase().includes(q)))
  }, [channels, active, query])

  const totalSubs = channels.reduce((s, c) => s + c.member_count, 0)

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#4C1D95] via-[#5b21b6] to-[#7C3AED]">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/[0.05]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/85 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            <Radio className="w-3 h-3" />Supplier Canales
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Follow the brands<br /><span className="text-purple-200">you trade with</span>
          </h1>
          <p className="text-white/65 text-base max-w-xl mx-auto leading-relaxed mb-8">
            Subscribe to supplier canales for exclusive offers, new product drops and trade updates — like WhatsApp channels, organised by category.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search canales or suppliers…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-lg" />
          </div>

          {/* mini stats */}
          <div className="flex items-center justify-center gap-8 mt-7">
            <div><p className="text-2xl font-extrabold text-white">{channels.length}</p><p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Canales</p></div>
            <div className="w-px h-8 bg-white/15" />
            <div><p className="text-2xl font-extrabold text-white">{totalSubs.toLocaleString()}</p><p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Subscribers</p></div>
            <div className="w-px h-8 bg-white/15" />
            <div><p className="text-2xl font-extrabold text-white">{categories.length - 1}</p><p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Categories</p></div>
          </div>
        </div>
      </div>

      {/* ── Category filter ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActive(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                active === cat ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Radio className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">No canales found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((ch, i) => {
              const sup = ch.supplier
              const name = sup?.trade_name ?? sup?.legal_name ?? 'Supplier'
              const initial = name[0]?.toUpperCase() ?? 'C'
              const t = ch.latest ? (TYPE[ch.latest.post_type] ?? TYPE.update) : null
              const isGold = sup?.reliability_tier === 'GOLD'
              return (
                <Reveal key={ch.id} delay={(i % 3) * 80}>
                  <Link href={`/channel/${ch.id}`}
                    className="group block bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full">
                    {/* Gradient cover */}
                    <div className="relative h-20 bg-gradient-to-br from-[#7C3AED] via-[#6d28d9] to-[#4C1D95] overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                      <Radio className="absolute -bottom-3 -right-2 w-20 h-20 text-white/10" />
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold text-white bg-white/15 border border-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">{ch.category}</span>
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-white/90 uppercase tracking-widest">
                        <Radio className="w-3 h-3" />Canal
                      </span>
                    </div>

                    {/* Logo overlapping */}
                    <div className="px-5 -mt-8">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#0B1F4D] flex items-center justify-center border-4 border-white shadow-md">
                        {sup?.logo_url
                          ? <Image src={sup.logo_url} alt={name} width={64} height={64} className="object-cover w-full h-full" />
                          : <span className="text-white font-extrabold text-2xl">{initial}</span>}
                      </div>
                    </div>

                    <div className="px-5 pt-3 pb-5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-[#0B1F4D] text-base truncate group-hover:text-[#7C3AED] transition-colors">{ch.name}</h3>
                        {isGold && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-3">by {name}</p>

                      {/* Latest post preview */}
                      {ch.latest ? (
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
                          {t && <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mb-1.5 ${t.badge}`}><t.Icon className="w-2.5 h-2.5" />{t.label}</span>}
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{ch.latest.content || '📷 Photo'}</p>
                        </div>
                      ) : ch.description ? (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{ch.description}</p>
                      ) : (
                        <p className="text-xs text-gray-300 italic mb-4">No posts yet — be the first to follow</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ch.member_count.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{ch.post_count}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 bg-[#7C3AED] text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold group-hover:gap-2.5 transition-all shadow-sm">
                          <Radio className="w-3.5 h-3.5" />Join
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
