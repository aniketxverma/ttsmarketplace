import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles, Package, Users, MessageSquare, Bot, ArrowRight, Radio,
  Megaphone, Truck, Star, Store, Calendar, FileText, Zap, Target, Send,
} from 'lucide-react'
import { OfferRail, type RailOffer } from '@/components/ai/OfferRail'
import { MatchButton, ExploreButton, ActionTile } from '@/components/ai/AssistantActions'

export const metadata = { title: 'AI Business Assistant · TTAI EMA' }
export const revalidate = 60

async function safe<T>(q: any, fb: T): Promise<T> { try { const { data } = await q; return (data ?? fb) as T } catch { return fb } }
async function count(q: any): Promise<number> { try { const { count } = await q; return count ?? 0 } catch { return 0 } }
const money = (c: number, cur = 'EUR') => new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur || 'EUR' }).format((c ?? 0) / 100)
function ago(d: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; return `${Math.round(h / 24)}d ago`
}

export default async function AssistantPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let name: string | null = null
  if (user) { const { data } = await (supabase.from('profiles') as any).select('full_name').eq('id', user.id).single(); name = data?.full_name ?? null }
  const firstName = name?.split(' ')[0] ?? null
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

  // ── Real platform signals ──
  const newOffers = await count((supabase.from('products') as any).select('id', { count: 'exact', head: true }).eq('is_published', true).gte('created_at', weekAgo))
  const activeSuppliers = await count((supabase.from('suppliers') as any).select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'))
  const newPosts = await count((supabase.from('channel_posts') as any).select('id', { count: 'exact', head: true }).gte('created_at', weekAgo))
  const channels = await count((supabase.from('supplier_channels') as any).select('id', { count: 'exact', head: true }).eq('is_active', true))

  // Assistant avatar (generated mascot, stored in app_settings).
  const avatarRow = await safe<any>(supabase.from('app_settings').select('value').eq('key', 'assistant_avatar_url').single(), null)
  const avatarUrl: string | null = avatarRow?.value ?? null
  const isoFlag = (iso?: string | null) => iso && iso.length === 2 ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🌍'

  // Today's Best Offers — round-robin across SUPPLIERS so the rail is genuinely
  // varied (food, oil, cleaning, audio, electronics…) instead of 8 items from
  // whichever supplier imported last. Each active supplier contributes a few of
  // its products (image-first), then we interleave them.
  const sups = await safe<any[]>((supabase.from('suppliers') as any)
    .select('id, trade_name, legal_name, status, countries(iso_code)')
    .eq('status', 'ACTIVE').limit(24), [])
  const perSupplier = await Promise.all(sups.map(async (s) => {
    const list = await safe<any[]>((supabase.from('products') as any)
      .select('id, name, slug, price_cents, currency_code, created_at, product_images(url, sort_order)')
      .eq('supplier_id', s.id).eq('is_published', true).order('created_at', { ascending: false }).limit(6), [])
    // image-first ordering within a supplier
    list.sort((a, b) => ((b.product_images?.length ? 1 : 0) - (a.product_images?.length ? 1 : 0)))
    return { s, list }
  }))
  const queues = perSupplier.filter((x) => x.list.length)
  const offers: RailOffer[] = []
  const MAX = 16
  while (offers.length < MAX && queues.some((q) => q.list.length)) {
    for (const q of queues) {
      const p = q.list.shift()
      if (!p) continue
      const img = ((p.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null
      offers.push({
        id: p.id, name: p.name, slug: p.slug ?? p.id, price: money(p.price_cents, p.currency_code),
        img, supplier: q.s.trade_name ?? q.s.legal_name ?? 'Supplier',
        flag: isoFlag(q.s.countries?.iso_code), fresh: (Date.now() - new Date(p.created_at).getTime()) < 3 * 864e5,
      })
      if (offers.length >= MAX) break
    }
  }

  const posts = await safe<any[]>((supabase.from('channel_posts') as any)
    .select('id, content, image_url, post_type, created_at, supplier_channels(name)')
    .order('created_at', { ascending: false }).limit(6), [])

  const recommended = await safe<any[]>((supabase.from('suppliers') as any)
    .select('id, trade_name, legal_name, logo_url, reliability_tier, tagline, description, countries(name)')
    .eq('status', 'ACTIVE').order('reliability_tier', { ascending: true }).limit(6), [])

  const opportunities = newOffers + newPosts + recommended.length

  // AI insight feed — derived from the real signals above (the "I found…" cards).
  const insights = [
    newOffers > 0 && { Icon: Megaphone, color: 'text-blue-600 bg-blue-50', title: 'New offers published', body: `${newOffers} new product offer${newOffers !== 1 ? 's' : ''} went live this week — fresh stock to source.`, href: '/marketplace' },
    newPosts > 0 && { Icon: Radio, color: 'text-green-600 bg-green-50', title: 'WhatsApp channel activity', body: `${newPosts} new channel post${newPosts !== 1 ? 's' : ''} from suppliers — offers, stock and deals.`, href: '/whatsapp-hub' },
    recommended.length > 0 && { Icon: Star, color: 'text-amber-600 bg-amber-50', title: 'Recommended suppliers', body: `${recommended.length} verified suppliers match your market — worth a look.`, href: '/suppliers' },
    { Icon: Truck, color: 'text-violet-600 bg-violet-50', title: 'Logistics opportunity', body: 'Consolidated shipping routes available across Europe this week.', href: '/marketplace' },
  ].filter(Boolean) as { Icon: any; color: string; title: string; body: string; href: string }[]

  const STATS = [
    { Icon: Package, value: newOffers, label: 'New Offers', sub: 'This week', tint: 'bg-emerald-50 text-emerald-600' },
    { Icon: Users, value: activeSuppliers, label: 'Active Suppliers', sub: 'Verified', tint: 'bg-blue-50 text-blue-600' },
    { Icon: MessageSquare, value: newPosts, label: 'Channel Updates', sub: 'This week', tint: 'bg-violet-50 text-violet-600' },
    { Icon: Radio, value: channels, label: 'Live Channels', sub: 'Following', tint: 'bg-amber-50 text-amber-600' },
  ]
  // Each tile either opens the AI assistant (prompt) or goes to a real page (href).
  const RECO = [
    { Icon: Store, title: 'New Suppliers for You', desc: `${recommended.length} verified suppliers`, href: '/suppliers' },
    { Icon: Target, title: 'Franchise Opportunities', desc: 'Expansion options', href: '/projects' },
    { Icon: Calendar, title: 'Trade Shows & Events', desc: 'Ask the assistant', prompt: 'What upcoming trade shows and B2B events across Europe, the Middle East and Africa are relevant for my business?' },
    { Icon: FileText, title: 'Market Reports', desc: 'Ask the assistant', prompt: 'Give me a quick market overview and the best current offers across categories on TTAI.' },
  ]
  const QUICK = [
    { Icon: Send, title: 'Post a Request', desc: 'Find products or suppliers', prompt: 'I want to post a sourcing request — help me find products and the right suppliers.' },
    { Icon: Package, title: 'Add Your Products', desc: 'Promote your business', href: '/supplier' },
    { Icon: Truck, title: 'Request a Shipment', desc: 'Logistics support', href: '/contact?dept=logistics' },
    { Icon: Radio, title: 'Join a Channel', desc: 'Real-time offers', href: '/whatsapp-hub' },
  ]

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-[1500px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <main className="space-y-5 min-w-0">

          {/* Greeting */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white p-7 sm:p-9">
            <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-[#F5A623]/15 blur-3xl pointer-events-none" />
            <div className="relative flex items-start gap-5">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#F5A623] mb-3"><Sparkles className="w-3.5 h-3.5" /> AI Business Assistant</span>
                <h1 className="text-2xl sm:text-4xl font-black leading-tight">Welcome back{firstName ? `, ${firstName}` : ''}! 👋</h1>
                <p className="text-blue-100/80 mt-2 max-w-xl">I analysed the platform and found <strong className="text-[#F5A623]">{opportunities} new opportunit{opportunities === 1 ? 'y' : 'ies'}</strong> for your business today — offers, suppliers and channel activity worth your attention.</p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <ExploreButton />
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-5 py-2.5 text-sm font-bold"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Assistant online</span>
                </div>
              </div>
              {/* Assistant avatar */}
              <div className="hidden sm:block relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-[#F5A623]/25 blur-2xl" />
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="TTAI Assistant" width={132} height={132} className="relative w-28 lg:w-32 h-28 lg:h-32 object-contain drop-shadow-2xl animate-[mallFloat_5s_ease-in-out_infinite]" />
                ) : (
                  <Bot className="relative w-28 h-28 text-white/80" strokeWidth={1.2} />
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.tint}`}><s.Icon className="w-5 h-5" /></span>
                <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
                <p className="text-xs font-bold text-gray-700 mt-1">{s.label}</p>
                <p className="text-[11px] text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Today's best offers — varied across suppliers, auto-scrolling */}
          <Section title="Today's Best Offers for You" subtitle="A fresh mix from across the marketplace — updated continuously" href="/marketplace" hrefLabel="View all offers">
            <OfferRail offers={offers} />
          </Section>

          {/* Latest from channels */}
          {posts.length > 0 && (
            <Section title="Latest from WhatsApp Channels" subtitle="Real-time updates from supplier channels" href="/whatsapp-hub" hrefLabel="View all channels">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {posts.map((p) => (
                  <Link key={p.id} href="/whatsapp-hub" className="rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-all">
                    {p.image_url && (/* eslint-disable-next-line @next/next/no-img-element */<img src={p.image_url} alt="" className="w-full h-28 object-cover" />)}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><Radio className="w-3 h-3" />{(p.supplier_channels as any)?.name ?? 'Channel'}</span>
                        <span className="text-[10px] text-gray-400">{ago(p.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{p.content || 'New post'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Recommended */}
          <Section title="Recommended for Your Business" subtitle="Opportunities that match your interests">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {RECO.map((r) => (
                <ActionTile key={r.title} variant="reco"
                  icon={<r.Icon className="w-5 h-5 text-[#0B1F4D]" />}
                  title={r.title} desc={r.desc} href={(r as any).href} prompt={(r as any).prompt} />
              ))}
            </div>
          </Section>
        </main>

        {/* ── Right: AI feed + quick actions ── */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] text-white">
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center overflow-hidden">
                {avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} className="w-full h-full object-contain" /> : <Bot className="w-4 h-4 text-[#F5A623]" />}
              </span>
              <div><p className="text-sm font-extrabold leading-none">TTAI AI Assistant</p><p className="text-[10px] text-green-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Online</p></div>
            </div>
            <div className="p-3 space-y-2.5">
              <p className="text-xs text-gray-500 px-1">Here&apos;s what I found for you today:</p>
              {insights.map((it) => (
                <Link key={it.title} href={it.href} className="block rounded-xl border border-gray-100 p-3 hover:border-[#0B1F4D]/30 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${it.color}`}><it.Icon className="w-4 h-4" /></span>
                    <p className="text-xs font-extrabold text-gray-900">{it.title}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{it.body}</p>
                </Link>
              ))}
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Ask me anything about products, suppliers or logistics</p>
                <p className="text-[11px] text-gray-400">Tap the <strong className="text-[#0B1F4D]">assistant bubble</strong> at the bottom-right to chat 💬</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#5b3fd6] to-[#7c3aed] text-white p-5">
            <Zap className="w-7 h-7 text-white/80 mb-2" />
            <p className="font-extrabold">Smart Business Matching</p>
            <p className="text-white/75 text-xs mt-1">Let AI find the best suppliers and deals for your business.</p>
            <MatchButton />
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Quick Actions</p>
            <div className="space-y-1">
              {QUICK.map((q) => (
                <ActionTile key={q.title} variant="quick"
                  icon={<q.Icon className="w-4 h-4 text-[#0B1F4D]" />}
                  title={q.title} desc={q.desc} href={(q as any).href} prompt={(q as any).prompt} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Section({ title, subtitle, href, hrefLabel, children }: { title: string; subtitle?: string; href?: string; hrefLabel?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {href && <Link href={href} className="text-xs font-bold text-[#0B1F4D] hover:underline whitespace-nowrap inline-flex items-center gap-1">{hrefLabel ?? 'View all'} <ArrowRight className="w-3.5 h-3.5" /></Link>}
      </div>
      {children}
    </div>
  )
}
