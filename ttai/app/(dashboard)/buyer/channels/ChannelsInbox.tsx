'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio, Search, ArrowLeft, Bell, Tag, Package, Megaphone,
  ExternalLink, MessageSquare, MoreVertical,
} from 'lucide-react'

type Supplier = { trade_name: string | null; legal_name: string | null; logo_url: string | null; brand_slug: string | null }
type Post = { id: string; content: string; image_url: string | null; video_url?: string | null; post_type: string; created_at: string }
export type InboxChannel = {
  id: string; name: string; description: string | null; whatsapp: string | null
  member_count: number; post_count: number; joined_at: string
  supplier: Supplier | null
  latest: Post | null
}

// WhatsApp-style doodle wallpaper.
const DOODLE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cg fill='none' stroke='%239aa6a0' stroke-width='1' opacity='0.22'%3E%3Cpath d='M10 16c2-3 7-3 9 0'/%3E%3Ccircle cx='74' cy='14' r='4'/%3E%3Cpath d='M16 66l4-7 4 7z'/%3E%3Cpath d='M64 72c-3-3-1-7 4-5 4-2 6 2 3 5l-3 3z'/%3E%3Cpath d='M42 44h9M46 40v9'/%3E%3Cpath d='M80 50c0 3-2 5-5 5'/%3E%3Cpath d='M10 44c3 2 6 2 9 0'/%3E%3Crect x='56' y='34' width='8' height='8' rx='2'/%3E%3Cpath d='M84 80c2-3 6-3 8 0'/%3E%3Ccircle cx='30' cy='84' r='4'/%3E%3C/g%3E%3C/svg%3E\")"

const TYPE: Record<string, { label: string; badge: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-50 text-blue-600',    color: '#1f7aec', Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-50 text-amber-700',  color: '#c77700', Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-50 text-purple-700',color: '#7c3aed', Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-50 text-green-700',  color: '#1f9d55', Icon: Megaphone },
}

function fmtListTime(iso: string) {
  const d = new Date(iso); const diff = Date.now() - d.getTime()
  if (diff < 86400000 && d.toDateString() === new Date().toDateString())
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86400000) return d.toLocaleDateString('en', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function fmtDay(iso: string) {
  const d = new Date(iso); const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'TODAY'
  const y = new Date(today); y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'YESTERDAY'
  return d.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
}
function preview(p: Post | null) {
  if (!p) return 'No posts yet'
  if (p.video_url && !p.content) return '🎥 Video'
  if (p.image_url && !p.content) return '📷 Photo'
  return p.content
}

function Avatar({ supplier, name, size = 44 }: { supplier: Supplier | null; name: string; size?: number }) {
  const initial = (supplier?.trade_name ?? name ?? 'C')[0]?.toUpperCase() ?? 'C'
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 bg-[#00a884] flex items-center justify-center"
      style={{ width: size, height: size }}>
      {supplier?.logo_url
        ? <Image src={supplier.logo_url} alt="" width={size} height={size} className="object-cover w-full h-full" />
        : <span className="text-white font-extrabold" style={{ fontSize: size * 0.4 }}>{initial}</span>}
    </div>
  )
}

export function ChannelsInbox({ channels }: { channels: InboxChannel[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(channels[0]?.id ?? null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const selected = useMemo(() => channels.find(c => c.id === selectedId) ?? null, [channels, selectedId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return channels
    return channels.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.supplier?.trade_name ?? '').toLowerCase().includes(q))
  }, [channels, query])

  useEffect(() => {
    if (!selectedId) return
    let active = true
    setLoading(true)
    fetch(`/api/channels/${selectedId}/posts?limit=50`)
      .then(r => r.json())
      .then(({ posts }) => { if (active) setPosts(posts ?? []) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedId])

  function openChannel(id: string) { setSelectedId(id); setMobileOpen(true) }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[520px] rounded-xl border border-black/10 overflow-hidden shadow-sm">

      {/* ── LEFT: channel list (WhatsApp Web) ──────────────────────────── */}
      <aside className={`${mobileOpen ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[360px] lg:w-[400px] border-r border-black/10 bg-white`}>
        {/* Panel header */}
        <div className="h-[59px] px-4 flex items-center justify-between flex-shrink-0" style={{ background: '#f0f2f5' }}>
          <h1 className="font-semibold text-[#111b21] text-[17px]">Channels</h1>
          <div className="flex items-center gap-1 text-[#54656f]">
            <span className="text-xs font-bold text-[#54656f] bg-black/[0.06] px-2 py-0.5 rounded-full">{channels.length}</span>
            <button className="w-9 h-9 rounded-full hover:bg-black/[0.05] flex items-center justify-center"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 bg-white flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#54656f]" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search channels"
              className="w-full pl-11 pr-3 py-1.5 rounded-lg bg-[#f0f2f5] text-[14px] focus:outline-none placeholder-[#667781] text-[#111b21]" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Radio className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">{query ? 'No channels match' : 'No channels yet'}</p>
              {!query && (
                <Link href="/marketplace" className="mt-3 inline-block text-xs font-bold text-[#00a884] hover:underline">
                  Discover suppliers →
                </Link>
              )}
            </div>
          ) : filtered.map(ch => {
            const isActive = ch.id === selectedId
            const t = ch.latest ? (TYPE[ch.latest.post_type] ?? TYPE.update) : null
            return (
              <button key={ch.id} onClick={() => openChannel(ch.id)}
                className={`w-full flex items-center gap-3 pl-3 pr-3 text-left transition-colors ${
                  isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                }`}>
                <Avatar supplier={ch.supplier} name={ch.name} size={49} />
                <div className="flex-1 min-w-0 border-b border-black/[0.06] py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-normal text-[16px] text-[#111b21] truncate">{ch.name}</p>
                    {ch.latest && <span className="text-[12px] text-[#667781] flex-shrink-0">{fmtListTime(ch.latest.created_at)}</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {t && <t.Icon className="w-3.5 h-3.5 text-[#8696a0] flex-shrink-0" />}
                    <p className="text-[14px] text-[#667781] truncate">{preview(ch.latest)}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── RIGHT: chat view ───────────────────────────────────────────── */}
      <section className={`${mobileOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-b-4 border-[#00a884]" style={{ background: '#f0f2f5' }}>
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-5 shadow-sm">
              <MessageSquare className="w-10 h-10 text-[#54656f]/40" />
            </div>
            <p className="text-[#41525d] font-light text-2xl">TTAI EMA Channels</p>
            <p className="text-[#667781] text-sm mt-2 max-w-sm">Select a channel to read updates from suppliers you follow.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 h-[59px] flex-shrink-0" style={{ background: '#f0f2f5' }}>
              <button onClick={() => setMobileOpen(false)}
                className="md:hidden w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-[#54656f] hover:bg-black/[0.05]">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar supplier={selected.supplier} name={selected.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-[#111b21] font-medium text-[16px] truncate">{selected.name}</p>
                <p className="text-[#667781] text-[13px] truncate">
                  Channel · {selected.member_count.toLocaleString()} followers
                </p>
              </div>
              <Link href={`/channel/${selected.id}`} target="_blank"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#54656f] hover:bg-black/[0.05]" title="Open full channel">
                <ExternalLink className="w-5 h-5" />
              </Link>
            </div>

            {/* Messages on doodle wallpaper */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-[5%] py-4"
              style={{ backgroundColor: '#efeae2', backgroundImage: DOODLE }}>
              {loading ? (
                <div className="flex justify-center pt-10">
                  <div className="w-6 h-6 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex justify-center pt-6">
                  <span className="bg-white text-[#54656f] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
                    No posts yet — you&apos;ll see updates here when they post.
                  </span>
                </div>
              ) : (
                <div className="space-y-2 max-w-2xl mx-auto">
                  {[...posts].reverse().map((post, idx, arr) => {
                    const cfg = TYPE[post.post_type] ?? TYPE.update
                    const day = new Date(post.created_at).toDateString()
                    const prevDay = idx > 0 ? new Date(arr[idx - 1].created_at).toDateString() : null
                    const showDay = idx === 0 || (prevDay && day !== prevDay)
                    return (
                      <div key={post.id}>
                        {showDay && (
                          <div className="flex justify-center py-2.5">
                            <span className="bg-white text-[#54656f] text-[12px] font-medium px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide">
                              {fmtDay(post.created_at)}
                            </span>
                          </div>
                        )}
                        <div className="flex">
                          <div className="relative max-w-[88%] sm:max-w-[75%] bg-white rounded-lg rounded-tl-none shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                            <span className="absolute -left-1.5 top-0 w-2 h-3 overflow-hidden">
                              <span className="absolute right-0 top-0 w-3 h-3 bg-white rotate-45 origin-top-right" />
                            </span>
                            {post.video_url ? (
                              <div className="p-[3px]"><video src={post.video_url} controls className="w-full h-auto rounded-[6px] bg-black" /></div>
                            ) : post.image_url && (
                              <div className="p-[3px]"><img src={post.image_url} alt="" loading="lazy" className="w-full h-auto rounded-[6px]" /></div>
                            )}
                            <div className="px-2.5 pt-1.5 pb-1.5">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[13px] font-bold truncate" style={{ color: cfg.color }}>
                                  {selected.supplier?.trade_name ?? selected.name}
                                </span>
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-px rounded ${cfg.badge}`}>
                                  <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
                                </span>
                              </div>
                              {post.content && (
                                <p className="text-[14.2px] leading-[19px] text-[#111b21] whitespace-pre-line">
                                  {post.content}<span className="inline-block w-12 h-1 align-bottom" />
                                </p>
                              )}
                              <span className={`float-right text-[11px] text-[#667781] ${post.content ? '-mt-3.5' : ''} ml-2`}>
                                {fmtMsgTime(post.created_at)}
                              </span>
                              <div className="clear-both" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2 flex items-center justify-center gap-2 flex-shrink-0" style={{ background: '#f0f2f5' }}>
              <Radio className="w-3.5 h-3.5 text-[#8696a0]" />
              <p className="text-[12px] text-[#667781]">Following · only {selected.supplier?.trade_name ?? 'the supplier'} can post here</p>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
