'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio, Users, FileText, Search, Bell, Tag, Package, Megaphone, Crown,
  Star, Send, MessagesSquare, Sparkles,
} from 'lucide-react'

type Supplier = { trade_name: string | null; legal_name: string | null; logo_url: string | null; brand_slug?: string | null; reliability_tier?: string | null }
type Post = { content: string; image_url: string | null; post_type: string; created_at: string }

export type DiscoveryChannel = {
  id: string; name: string; description: string | null
  member_count: number; post_count: number; category: string; paid: boolean
  supplier: Supplier | null; latest: Post | null
}
export type FeedPost = {
  id: string; channel_id: string; channel_name: string
  content: string; image_url: string | null; video_url?: string | null; post_type: string; created_at: string
  category: string; paid: boolean; supplier: Supplier | null
}
export type GroupItem = {
  id: string; name: string; description: string | null; category: string
  invite_link: string; member_count: number; paid: boolean; supplier: Supplier | null
}

const TYPE: Record<string, { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',     Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700',   Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700', Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700',   Icon: Megaphone },
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - +new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

/** Open WhatsApp share with the given text + a link back to this page path. */
function shareWA(text: string, path?: string) {
  const url = path ? `${window.location.origin}${path}` : window.location.href
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`, '_blank')
}

function PaidBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#7a5b00] bg-gradient-to-r from-[#F5D77E] to-[#F5A623] px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
      <Star className="w-2.5 h-2.5" />Featured
    </span>
  )
}

function Avatar({ sup, size = 40 }: { sup: Supplier | null; size?: number }) {
  const name = sup?.trade_name ?? sup?.legal_name ?? 'Supplier'
  return (
    <div className="rounded-full overflow-hidden bg-[#00a884] flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      {sup?.logo_url
        ? <Image src={sup.logo_url} alt={name} width={size} height={size} className="object-cover w-full h-full" />
        : <span className="text-white font-extrabold" style={{ fontSize: size * 0.4 }}>{name[0]?.toUpperCase() ?? 'C'}</span>}
    </div>
  )
}

export function ChannelsDiscovery({ channels, feed, groups }: { channels: DiscoveryChannel[]; feed: FeedPost[]; groups: GroupItem[] }) {
  const [view, setView] = useState<'feed' | 'channels' | 'groups'>('feed')
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>()
    channels.forEach(c => set.add(c.category))
    groups.forEach(g => set.add(g.category))
    return ['All', ...Array.from(set).sort()]
  }, [channels, groups])

  const q = query.trim().toLowerCase()
  const filteredChannels = useMemo(() => channels.filter(c =>
    (active === 'All' || c.category === active) &&
    (!q || c.name.toLowerCase().includes(q) || (c.supplier?.trade_name ?? '').toLowerCase().includes(q))), [channels, active, q])
  const filteredGroups = useMemo(() => groups.filter(g =>
    (active === 'All' || g.category === active) &&
    (!q || g.name.toLowerCase().includes(q) || (g.supplier?.trade_name ?? '').toLowerCase().includes(q))), [groups, active, q])
  const filteredFeed = useMemo(() => feed.filter(p =>
    (active === 'All' || p.category === active) &&
    (!q || p.content.toLowerCase().includes(q) || (p.supplier?.trade_name ?? '').toLowerCase().includes(q))), [feed, active, q])

  const totalSubs = channels.reduce((s, c) => s + c.member_count, 0)

  const TABS = [
    { key: 'feed' as const,     label: 'Offers feed', Icon: Sparkles,       count: feed.length },
    { key: 'channels' as const, label: 'Canales',     Icon: Radio,          count: channels.length },
    { key: 'groups' as const,   label: 'WA Groups',   Icon: MessagesSquare, count: groups.length },
  ]

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#075E54] via-[#0b7d6e] to-[#00a884]">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/[0.05]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/85 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            <Radio className="w-3 h-3" />Live Supplier Offers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Offers passing<br /><span className="text-emerald-200">right now</span>
          </h1>
          <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed mb-7">
            A live feed of supplier offers — follow channels and join WhatsApp groups for exclusive deals and product drops, just like WhatsApp.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search offers, channels or groups…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-lg" />
          </div>

          <div className="flex items-center justify-center gap-8 mt-7">
            <div><p className="text-2xl font-extrabold text-white">{channels.length}</p><p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Canales</p></div>
            <div className="w-px h-8 bg-white/15" />
            <div><p className="text-2xl font-extrabold text-white">{totalSubs.toLocaleString()}</p><p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Subscribers</p></div>
            <div className="w-px h-8 bg-white/15" />
            <div><p className="text-2xl font-extrabold text-white">{groups.length}</p><p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Groups</p></div>
          </div>
        </div>
      </div>

      {/* ── View tabs ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex gap-1 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(({ key, label, Icon, count }) => (
              <button key={key} onClick={() => setView(key)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  view === key ? 'bg-[#00a884] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                <Icon className="w-4 h-4" />{label}
                <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full ${view === key ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
              </button>
            ))}
          </div>
          {/* Category filter (channels & groups) */}
          {view !== 'feed' && (
            <div className="flex gap-2 overflow-x-auto pb-2.5" style={{ scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActive(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    active === cat ? 'bg-[#0B1F4D] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{cat}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* ── OFFERS FEED ──────────────────────────────────────────────── */}
        {view === 'feed' && (
          filteredFeed.length === 0 ? (
            <Empty Icon={Sparkles} title="No offers yet" sub="Suppliers haven’t posted offers yet — check the canales." />
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {filteredFeed.map((p) => {
                const t = TYPE[p.post_type] ?? TYPE.update
                const name = p.supplier?.trade_name ?? p.supplier?.legal_name ?? 'Supplier'
                const hasMedia = !!(p.video_url || p.image_url)
                const placeholder = p.content === '📷 Photo' || p.content === '🎥 Video'
                const showText = !!p.content.trim() && !(placeholder && hasMedia)
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 pt-3.5 pb-1">
                      <Avatar sup={p.supplier} size={42} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/channel/${p.channel_id}`} className="font-extrabold text-[#0B1F4D] text-sm truncate hover:text-[#00a884]">{p.channel_name}</Link>
                          {p.paid && <PaidBadge />}
                        </div>
                        <p className="text-[11px] text-gray-400">by {name} · {timeAgo(p.created_at)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${t.badge}`}><t.Icon className="w-2.5 h-2.5" />{t.label}</span>
                    </div>

                    {/* Media — full image, correct aspect ratio (no cropping) */}
                    {hasMedia && (
                      <div className="px-2 pt-1.5">
                        {p.video_url
                          ? <video src={p.video_url} controls className="w-full h-auto rounded-xl bg-black" />
                          : <img src={p.image_url!} alt="" loading="lazy" className="w-full h-auto rounded-xl bg-gray-50" />}
                      </div>
                    )}

                    {/* Caption (only if it's real text) */}
                    {showText && (
                      <div className="px-4 pt-3">
                        <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 mt-2 border-t border-gray-50">
                      <Link href={`/channel/${p.channel_id}`} className="text-xs font-bold text-[#00a884] hover:underline">View channel →</Link>
                      <button onClick={() => shareWA(`${name}: ${showText ? p.content : 'New offer'}`, `/channel/${p.channel_id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#075E54] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 px-3 py-1.5 rounded-lg transition-colors">
                        <Send className="w-3.5 h-3.5 text-[#1ea952]" />Share on WhatsApp
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── CANALES GRID ─────────────────────────────────────────────── */}
        {view === 'channels' && (
          filteredChannels.length === 0 ? (
            <Empty Icon={Radio} title="No canales found" sub="Try a different category or search term." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredChannels.map((ch) => {
                const sup = ch.supplier
                const name = sup?.trade_name ?? sup?.legal_name ?? 'Supplier'
                const t = ch.latest ? (TYPE[ch.latest.post_type] ?? TYPE.update) : null
                const isGold = sup?.reliability_tier === 'GOLD'
                return (
                  <Link key={ch.id} href={`/channel/${ch.id}`}
                    className={`group block bg-white rounded-3xl border shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full ${ch.paid ? 'border-[#F5A623]/40 ring-1 ring-[#F5A623]/20' : 'border-gray-100'}`}>
                    <div className="relative h-20 bg-gradient-to-br from-[#075E54] via-[#0b7d6e] to-[#00a884] overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                      <Radio className="absolute -bottom-3 -right-2 w-20 h-20 text-white/10" />
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold text-white bg-white/15 border border-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">{ch.category}</span>
                      {ch.paid && <span className="absolute top-3 left-3"><PaidBadge /></span>}
                    </div>
                    <div className="px-5 -mt-9 relative z-10">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#0B1F4D] flex items-center justify-center border-4 border-white shadow-md">
                        {sup?.logo_url
                          ? <Image src={sup.logo_url} alt={name} width={64} height={64} className="object-cover w-full h-full" />
                          : <span className="text-white font-extrabold text-2xl">{name[0]?.toUpperCase() ?? 'C'}</span>}
                      </div>
                    </div>
                    <div className="px-5 pt-3 pb-5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-[#0B1F4D] text-base truncate group-hover:text-[#00a884] transition-colors">{ch.name}</h3>
                        {isGold && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-3">by {name}</p>
                      {ch.latest ? (
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
                          {t && <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mb-1.5 ${t.badge}`}><t.Icon className="w-2.5 h-2.5" />{t.label}</span>}
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{ch.latest.content || (ch.latest.image_url ? '📷 Photo' : 'New post')}</p>
                        </div>
                      ) : ch.description ? (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{ch.description}</p>
                      ) : (
                        <p className="text-xs text-gray-300 italic mb-4">No posts yet — be the first to follow</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ch.member_count.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{ch.post_count}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 bg-[#00a884] text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold group-hover:gap-2.5 transition-all shadow-sm">
                          <Radio className="w-3.5 h-3.5" />Follow
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* ── WHATSAPP GROUPS ──────────────────────────────────────────── */}
        {view === 'groups' && (
          filteredGroups.length === 0 ? (
            <Empty Icon={MessagesSquare} title="No groups yet" sub="Suppliers can list their WhatsApp group links from their dashboard." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((g) => {
                const name = g.supplier?.trade_name ?? g.supplier?.legal_name ?? 'Supplier'
                return (
                  <div key={g.id} className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col ${g.paid ? 'border-[#F5A623]/40 ring-1 ring-[#F5A623]/20' : 'border-gray-100'}`}>
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                          <MessagesSquare className="w-6 h-6 text-[#1ea952]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-[#0B1F4D] text-base truncate">{g.name}</h3>
                            {g.paid && <PaidBadge />}
                          </div>
                          <p className="text-xs text-gray-400 truncate">by {name} · {g.category}</p>
                        </div>
                      </div>
                      {g.description && <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-3">{g.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 px-5 pb-5">
                      <a href={g.invite_link} target="_blank" rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ea952] text-white px-4 py-2.5 rounded-xl text-sm font-extrabold transition-colors">
                        <MessagesSquare className="w-4 h-4" />Join group
                      </a>
                      <button onClick={() => shareWA(`Join the ${g.name} WhatsApp group on TTAI EMA:`, undefined)}
                        title="Share"
                        className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function Empty({ Icon, title, sub }: { Icon: React.ComponentType<{ className?: string }>; title: string; sub: string }) {
  return (
    <div className="text-center py-24">
      <Icon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500 font-semibold">{title}</p>
      <p className="text-gray-400 text-sm mt-1">{sub}</p>
    </div>
  )
}
