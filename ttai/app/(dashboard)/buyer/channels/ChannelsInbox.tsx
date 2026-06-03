'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio, Search, ArrowLeft, Bell, Tag, Package, Megaphone,
  Users, ExternalLink, MessageSquare,
} from 'lucide-react'

type Supplier = { trade_name: string | null; legal_name: string | null; logo_url: string | null; brand_slug: string | null }
type Post = { id: string; content: string; image_url: string | null; post_type: string; created_at: string }
export type InboxChannel = {
  id: string; name: string; description: string | null; whatsapp: string | null
  member_count: number; post_count: number; joined_at: string
  supplier: Supplier | null
  latest: Post | null
}

const TYPE: Record<string, { label: string; badge: string; bar: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-500',   Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-500',  Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700',bar: 'bg-purple-500', Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700',  bar: 'bg-green-500',  Icon: Megaphone },
}

function fmtListTime(iso: string) {
  const d = new Date(iso); const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (diff < 86400000) return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86400000) return d.toLocaleDateString('en', { weekday: 'short' })
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}
function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}
function fmtDay(iso: string) {
  const d = new Date(iso); const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const y = new Date(today); y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Avatar({ supplier, name, size = 44 }: { supplier: Supplier | null; name: string; size?: number }) {
  const initial = (supplier?.trade_name ?? name ?? 'C')[0]?.toUpperCase() ?? 'C'
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 bg-[#0B1F4D] flex items-center justify-center"
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

  function openChannel(id: string) {
    setSelectedId(id)
    setMobileOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[520px] rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">

      {/* ── LEFT: channel list ─────────────────────────────────────────── */}
      <aside className={`${mobileOpen ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 bg-white`}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B1F4D] flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-extrabold text-[#0B1F4D] text-lg">My Canales</h1>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{channels.length}</span>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-gray-50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search canales…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/30 placeholder-gray-400" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Radio className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">{query ? 'No canales match' : 'No canales yet'}</p>
              {!query && (
                <Link href="/marketplace" className="mt-3 inline-block text-xs font-bold text-[#0B1F4D] hover:underline">
                  Discover suppliers →
                </Link>
              )}
            </div>
          ) : filtered.map(ch => {
            const isActive = ch.id === selectedId
            const t = ch.latest ? (TYPE[ch.latest.post_type] ?? TYPE.update) : null
            return (
              <button key={ch.id} onClick={() => openChannel(ch.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 border-b border-gray-50 text-left transition-colors ${
                  isActive ? 'bg-[#0B1F4D]/[0.05]' : 'hover:bg-gray-50'
                }`}>
                <Avatar supplier={ch.supplier} name={ch.name} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm text-gray-900 truncate">{ch.name}</p>
                    {ch.latest && <span className="text-[10px] text-gray-400 flex-shrink-0">{fmtListTime(ch.latest.created_at)}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {t && <t.Icon className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                    <p className="text-xs text-gray-400 truncate">
                      {ch.latest ? (ch.latest.image_url && !ch.latest.content ? '📷 Photo' : ch.latest.content) : 'No posts yet'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── RIGHT: feed ────────────────────────────────────────────────── */}
      <section className={`${mobileOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`}
        style={{ background: '#F0F2F5' }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0B1F4D]/5 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#0B1F4D]/30" />
            </div>
            <p className="text-gray-500 font-semibold">Select a canal to view updates</p>
            <p className="text-gray-400 text-sm mt-1">Your subscribed suppliers&apos; posts appear here.</p>
          </div>
        ) : (
          <>
            {/* Feed header */}
            <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 bg-[#0B1F4D] flex-shrink-0">
              <button onClick={() => setMobileOpen(false)}
                className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar supplier={selected.supplier} name={selected.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{selected.name}</p>
                <p className="text-white/50 text-[11px] flex items-center gap-1">
                  <Users className="w-3 h-3" />{selected.member_count.toLocaleString()} subscribers
                </p>
              </div>
              <Link href={`/channel/${selected.id}`} target="_blank"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10" title="Open full canal">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4">
              {loading ? (
                <div className="flex justify-center pt-10">
                  <div className="w-6 h-6 border-2 border-[#0B1F4D]/30 border-t-[#0B1F4D] rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bell className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 font-semibold text-sm">No posts yet</p>
                  <p className="text-gray-400 text-xs mt-0.5">You&apos;ll see updates here when they post.</p>
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
                          <div className="flex justify-center my-3">
                            <span className="bg-white text-gray-500 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm">
                              {fmtDay(post.created_at)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <Avatar supplier={selected.supplier} name={selected.name} size={30} />
                          <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden max-w-[85%]">
                            <div className={`h-0.5 ${cfg.bar}`} />
                            {post.image_url && (
                              <img src={post.image_url} alt="" className="w-full object-cover max-h-72" />
                            )}
                            <div className="px-3 sm:px-4 pt-2.5 pb-2.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-extrabold text-[#0B1F4D] truncate">
                                  {selected.supplier?.trade_name ?? selected.name}
                                </p>
                                <span className={`flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
                                  <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
                                </span>
                              </div>
                              {post.content && <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>}
                              <p className="text-[10px] text-gray-400 mt-1.5 text-right">{fmtMsgTime(post.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center justify-center gap-2 flex-shrink-0">
              <Radio className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[11px] text-gray-400">You&apos;re subscribed · only {selected.supplier?.trade_name ?? 'the supplier'} can post here</p>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
