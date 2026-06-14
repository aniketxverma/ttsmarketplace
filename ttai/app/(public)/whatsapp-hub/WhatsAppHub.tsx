'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, Megaphone, Users, Clock, ShieldCheck, Tag, Bell, Package,
  MessagesSquare, Globe, Layers, CheckCircle2,
} from 'lucide-react'

export type HubOffer = { content: string; image: string | null; video: boolean; type: string; created_at: string }
export type HubChannel = { id: string; name: string; supplier: string; logo: string | null; followers: number; verified: boolean; category: string; offers: HubOffer[] }
export type HubGroup = { id: string; name: string; description: string | null; category: string; region?: string | null; invite: string; members: number }
export type HubActivity = { channel: string; channelId: string; content: string; type: string; created_at: string }

function WaIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
}

const TYPE: Record<string, { label: string; badge: string; color: string; Icon: any }> = {
  update:       { label: 'Update',       badge: 'bg-blue-50 text-blue-600',   color: '#2563eb', Icon: Bell },
  offer:        { label: 'Offer',        badge: 'bg-amber-50 text-amber-700', color: '#d97706', Icon: Tag },
  product:      { label: 'Product',      badge: 'bg-purple-50 text-purple-700', color: '#7c3aed', Icon: Package },
  announcement: { label: 'Announcement', badge: 'bg-green-50 text-green-700',  color: '#16a34a', Icon: Megaphone },
}
const num = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - +new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function WhatsAppHub({ stats, categories, channels, groups, activity }: {
  stats: { channels: number; groups: number; members: number }
  categories: string[]; channels: HubChannel[]; groups: HubGroup[]; activity: HubActivity[]
}) {
  const [tab, setTab] = useState<'all' | 'channels' | 'groups'>('all')
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')

  const ql = q.trim().toLowerCase()
  const fChannels = useMemo(() => channels.filter((c) =>
    (cat === 'All' || c.category === cat) && (!ql || c.name.toLowerCase().includes(ql) || c.supplier.toLowerCase().includes(ql))), [channels, cat, ql])
  const fGroups = useMemo(() => groups.filter((g) =>
    (cat === 'All' || g.category === cat) && (!ql || g.name.toLowerCase().includes(ql))), [groups, cat, ql])

  const cats = ['All', ...categories]

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* ── Header + stats ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-7 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center"><WaIcon className="w-6 h-6 text-white" /></span>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111b21] leading-tight">WhatsApp Hub</h1>
              <p className="text-sm text-gray-500">Connect with real offers, negotiate and grow with our global community</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
            {[
              { Icon: Megaphone, n: stats.channels, t: 'Active channels', s: 'Real-time offers', c: '#075E54' },
              { Icon: Users,     n: stats.groups,   t: 'Active groups',   s: 'Negotiate & connect', c: '#00a884' },
              { Icon: Globe,     n: stats.members,  t: 'Members',         s: 'Across the community', c: '#128c7e', big: true },
              { Icon: Clock,     n: -1,             t: 'Real-time',       s: 'Live from WhatsApp', c: '#25D366' },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${x.c}1a` }}><x.Icon className="w-5 h-5" style={{ color: x.c }} /></span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-[#111b21] leading-none">{x.n < 0 ? '24/7' : (x.big ? `+${num(x.n)}` : x.n)}</p>
                  <p className="text-xs font-bold text-gray-700 mt-1 leading-none">{x.t}</p>
                  <p className="text-[11px] text-gray-400">{x.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs + filters ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Tabs — scroll horizontally on small screens */}
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {([['all', 'All'], ['channels', 'Offer Channels'], ['groups', 'Trading Groups']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${tab === k ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{l}</button>
            ))}
          </div>
          {/* Filters — full width on mobile, inline-right on desktop */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="flex-1 sm:flex-none min-w-0 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 px-3 py-2 focus:outline-none">
              {cats.map((c) => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
            </select>
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-column body ──────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[210px_1fr_300px] gap-5">

        {/* Left categories */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl bg-white border border-gray-200 p-4 sticky top-20">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Categories</p>
            <div className="space-y-0.5">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-left transition-colors ${cat === c ? 'bg-[#075E54]/10 text-[#075E54]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" />{c === 'All' ? 'All categories' : c}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center */}
        <main className="space-y-6 min-w-0">
          {(tab === 'all' || tab === 'channels') && (
            <section>
              <SectionHead Icon={Megaphone} title="Offer Channels" sub="Offers and product drops posted on our WhatsApp channels" />
              {fChannels.length === 0 ? <Empty text="No channels match your filters." /> : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {fChannels.map((c) => <ChannelCard key={c.id} c={c} />)}
                </div>
              )}
            </section>
          )}

          {(tab === 'all' || tab === 'groups') && (
            <section>
              <SectionHead Icon={Users} title="Trading Groups" sub="Negotiate, ask, source products and connect with buyers & suppliers" />
              {fGroups.length === 0 ? <Empty text="No groups yet — suppliers can add their WhatsApp group links from the dashboard." /> : (() => {
                // Group by region (only regions that actually have groups appear).
                const byRegion: Record<string, HubGroup[]> = {}
                for (const g of fGroups) (byRegion[g.region?.trim() || 'Other regions'] ||= []).push(g)
                const order = Object.keys(byRegion).sort((a, b) => (a === 'Other regions' ? 1 : b === 'Other regions' ? -1 : a.localeCompare(b)))
                return (
                  <div className="space-y-6">
                    {order.map((region) => (
                      <div key={region}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Globe className="w-4 h-4 text-[#00a884]" />
                          <h3 className="text-sm font-extrabold text-[#111b21] uppercase tracking-wide">{region}</h3>
                          <span className="text-[11px] font-bold text-gray-400">{byRegion[region].length}</span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {byRegion[region].map((g) => <GroupCard key={g.id} g={g} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </section>
          )}
        </main>

        {/* Right rail */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Live activity</p>
            {activity.length === 0 ? <p className="text-sm text-gray-400 py-3 text-center">No recent activity.</p> : activity.map((a, i) => {
              const t = TYPE[a.type] ?? TYPE.update
              return (
                <Link key={i} href={`/channel/${a.channelId}`} className="flex items-start gap-2.5 py-2.5 border-t border-gray-100 first:border-0 hover:bg-gray-50 -mx-1 px-1 rounded-lg">
                  <span className="w-7 h-7 rounded-full bg-[#075E54]/10 flex items-center justify-center flex-shrink-0 mt-0.5"><t.Icon className="w-3.5 h-3.5" style={{ color: t.color }} /></span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#111b21] truncate">{a.channel}</p>
                    <p className="text-[12px] text-gray-500 truncate">{a.content}</p>
                    <p className="text-[11px] text-gray-400">{timeAgo(a.created_at)} ago</p>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">How it works</p>
            {[
              'Explore channels & groups', 'Follow the ones you like', 'Negotiate & connect', 'Grow your business',
            ].map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-1.5">
                <span className="w-6 h-6 rounded-full bg-[#075E54] text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="text-sm text-gray-700 font-semibold">{s}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#075E54] to-[#00a884] text-white p-5">
            <p className="font-extrabold text-lg">Are you a supplier?</p>
            <p className="text-white/80 text-sm mt-1 mb-4">Publish your offers on our channels and reach thousands of buyers.</p>
            <Link href="/supplier/channel" className="inline-flex items-center gap-2 rounded-xl bg-white text-[#075E54] px-5 py-2.5 text-sm font-extrabold hover:bg-gray-100 transition-colors">
              <WaIcon className="w-4 h-4" />Publish offers
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Trust bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { Icon: WaIcon, t: 'Real WhatsApp content', s: 'Posts & messages in real time' },
            { Icon: Globe, t: 'Connect globally', s: 'Suppliers & buyers worldwide' },
            { Icon: MessagesSquare, t: 'Negotiate easily', s: 'Direct, fast communication' },
            { Icon: ShieldCheck, t: 'Safe & verified', s: 'Only official channels & groups' },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center flex-shrink-0"><x.Icon className="w-5 h-5 text-[#1ea952]" /></span>
              <div><p className="text-sm font-bold text-[#111b21]">{x.t}</p><p className="text-[11px] text-gray-400">{x.s}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionHead({ Icon, title, sub }: { Icon: any; title: string; sub: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-[#075E54]" /><h2 className="text-lg font-extrabold text-[#111b21]">{title}</h2></div>
      <p className="text-sm text-gray-400">{sub}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center text-sm text-gray-400">{text}</div>
}

function Avatar({ logo, name, size = 40 }: { logo: string | null; name: string; size?: number }) {
  return (
    <div className="rounded-full overflow-hidden bg-[#075E54] flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      {logo ? <Image src={logo} alt={name} width={size} height={size} className="object-cover w-full h-full" />
            : <span className="text-white font-extrabold" style={{ fontSize: size * 0.4 }}>{name[0]?.toUpperCase() ?? 'C'}</span>}
    </div>
  )
}

function ChannelCard({ c }: { c: HubChannel }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <div className="flex items-center gap-2.5 p-3.5 border-b border-gray-100">
        <Avatar logo={c.logo} name={c.name} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#111b21] text-sm truncate flex items-center gap-1">{c.name}{c.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884] flex-shrink-0" />}</p>
          <p className="text-[11px] text-gray-400">{num(c.followers)} followers</p>
        </div>
      </div>

      <div className="p-2.5 space-y-2 flex-1">
        {c.offers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No posts yet</p>
        ) : c.offers.map((o, i) => {
          const t = TYPE[o.type] ?? TYPE.update
          const ph = o.content === '📷 Photo' || o.content === '🎥 Video'
          return (
            <div key={i} className="flex gap-2.5 rounded-xl bg-gray-50 p-2">
              {o.image && <img src={o.image} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-px rounded ${t.badge}`}><t.Icon className="w-2.5 h-2.5" />{t.label}</span>
                <p className="text-[13px] text-gray-700 line-clamp-2 leading-snug mt-0.5">{ph && o.image ? (o.video ? '🎥 Video' : '📷 Photo') : o.content}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(o.created_at)} ago</p>
              </div>
            </div>
          )
        })}
      </div>

      <Link href={`/channel/${c.id}`} className="m-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 text-[#075E54] hover:bg-[#25D366]/10 text-sm font-bold py-2.5 transition-colors">
        <WaIcon className="w-4 h-4 text-[#1ea952]" />View channel
      </Link>
    </div>
  )
}

function GroupCard({ g }: { g: HubGroup }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <div className="flex items-start gap-3 p-4 flex-1">
        <span className="w-11 h-11 rounded-2xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0"><MessagesSquare className="w-6 h-6 text-[#1ea952]" /></span>
        <div className="min-w-0">
          <p className="font-extrabold text-[#111b21] text-sm truncate">{g.name}</p>
          <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" />{num(g.members)} members · {g.category}</p>
          {g.description && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{g.description}</p>}
        </div>
      </div>
      <a href={g.invite} target="_blank" rel="noopener noreferrer" className="m-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ea952] text-white text-sm font-extrabold py-2.5 transition-colors">
        <MessagesSquare className="w-4 h-4" />Join group
      </a>
    </div>
  )
}
