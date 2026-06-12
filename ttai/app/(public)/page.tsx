import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Reveal } from '@/components/Reveal'
import { RegionChooser } from '@/components/home/RegionChooser'
import { getMarketplaceOpen } from '@/lib/marketplace-phase'
import {
  ShieldCheck, Globe2, Headphones, Clock, ArrowRight, ShoppingCart, Boxes, Truck,
  MessageSquare, Share2, BarChart3, Lock, Factory, User, Building2, Store, Users,
  Package, Tag, Zap, CheckCircle2, TrendingUp,
} from 'lucide-react'

/* ─────────────────────────── data ─────────────────────────── */

const CHANNELS = [
  {
    title: 'TTAI Retail Store', sub: 'Buy by Piece & Box',
    desc: 'For end users and retail customers.', cta: 'Shop Retail', href: '/store',
    grad: 'from-violet-600 to-purple-700', Icon: ShoppingCart, btn: 'text-violet-700',
    badge: 'For Consumers', accent: '#8b5cf6', locked: true,
    tags: ['Single units', 'No minimums', 'Fast home delivery'],
  },
  {
    title: 'TTAI Business Shop', sub: 'Buy by Box & Pallet',
    desc: 'For shops, resellers and distributors.', cta: 'Shop Business', href: '/marketplace',
    grad: 'from-blue-600 to-[#0B1F4D]', Icon: Boxes, btn: 'text-blue-700',
    badge: 'Most Popular', accent: '#2563eb', locked: true,
    tags: ['Wholesale pricing', 'Bulk & pallet orders', 'Trade accounts'],
  },
  {
    title: 'TTAI Trade Hub', sub: 'Buy by Pallet & Truck',
    desc: 'For wholesalers, importers, exporters and factories.', cta: 'Shop Trade', href: '/b2b',
    grad: 'from-amber-500 to-orange-600', Icon: Truck, btn: 'text-orange-700',
    badge: 'For Wholesale', accent: '#f97316',
    tags: ['Container loads', 'Direct from factory', 'Export ready'],
  },
] as const

const WHY = [
  { Icon: ShieldCheck, title: 'Verified Suppliers', desc: 'All suppliers are verified and rated for your complete confidence.' },
  { Icon: Globe2,      title: 'International Trade', desc: 'Connect with partners worldwide and expand your market.' },
  { Icon: MessageSquare, title: 'Business Channels', desc: 'Get real-time offers, new products and updates directly in your inbox.' },
  { Icon: Truck,       title: 'Logistics Support', desc: 'End-to-end logistics solutions for smooth global delivery.' },
  { Icon: Share2,      title: 'Marketplace Network', desc: 'All-in-one platform connecting the entire supply chain.' },
  { Icon: BarChart3,   title: 'Global Expansion', desc: 'Tools and opportunities to scale your business internationally.' },
] as const

const CHAIN = [
  { Icon: Factory, label: 'Factory' },
  { Icon: User, label: 'Supplier' },
  { Icon: Building2, label: 'Distributor' },
  { Icon: ShoppingCart, label: 'Retail' },
] as const

const SALES = [
  { title: 'Online Shop', sub: 'Sell by Piece & Box', grad: 'from-violet-600 to-purple-700', Icon: ShoppingCart },
  { title: 'Business Shop', sub: 'Sell by Box & Pallet', grad: 'from-blue-600 to-[#0B1F4D]', Icon: Boxes },
  { title: 'Trade Hub', sub: 'Sell by Pallet & Truck', grad: 'from-amber-500 to-orange-600', Icon: Truck },
] as const

const STATS = [
  { Icon: Globe2, value: '50+', label: 'Countries' },
  { Icon: Users, value: '500+', label: 'Suppliers' },
  { Icon: Package, value: '5,000+', label: 'Products' },
  { Icon: Truck, value: '', label: 'International\nTrade Network' },
  { Icon: MessageSquare, value: '', label: 'Business\nChannels' },
] as const

const BRANDS = [
  { name: 'DOBOS DOBOS', place: 'Spain' },
  { name: 'ROZIL', place: 'Turkey' },
  { name: 'XO GLOBAL', place: 'China' },
  { name: 'VISCOSITY OIL', place: 'UAE' },
  { name: 'CHTAURA', place: 'Lebanon' },
  { name: 'TTAI LOGISTICS', place: 'Global' },
] as const

const FEED = [
  { Icon: Package, color: 'text-blue-600 bg-blue-50', title: 'New Product', sub: 'LED Smart Bulb 12W', time: 'Just now' },
  { Icon: Tag, color: 'text-amber-600 bg-amber-50', title: 'Special Offer', sub: '20% Off on All Kitchenware', time: '2m ago' },
  { Icon: Boxes, color: 'text-green-600 bg-green-50', title: 'Stock Available', sub: 'Pallets Ready to Ship', time: '5m ago' },
  { Icon: Truck, color: 'text-violet-600 bg-violet-50', title: 'Shipment Ready', sub: 'Your order is on the way', time: '10m ago' },
] as const

const CHIPS = [
  { Icon: Package, color: 'text-blue-600', title: 'New Product', sub: 'Check out latest arrivals' },
  { Icon: Boxes, color: 'text-green-600', title: 'Stock Available', sub: 'Ready to ship products' },
  { Icon: Tag, color: 'text-amber-600', title: 'Special Offer', sub: 'Exclusive deals for you' },
  { Icon: Zap, color: 'text-rose-600', title: 'Liquidation Deal', sub: 'Limited time opportunities' },
] as const

const PAYMENTS = [
  { label: 'stripe', cls: 'text-[#635bff]' }, { label: 'wise', cls: 'text-[#163300]' },
  { label: 'VISA', cls: 'text-[#1a1f71]' }, { label: 'mastercard', cls: 'text-[#eb001b]' },
  { label: 'PayPal', cls: 'text-[#003087]' }, { label: 'DHL', cls: 'text-[#d40511]' },
  { label: 'GLS', cls: 'text-[#061ab1]' }, { label: 'FedEx', cls: 'text-[#4d148c]' },
] as const

const GROW = [
  { Icon: Globe2, title: 'Global Reach', desc: 'Access buyers in 50+ countries.' },
  { Icon: ShieldCheck, title: 'Secure & Safe', desc: 'Protected payments and secure trading.' },
  { Icon: BarChart3, title: 'Powerful Tools', desc: 'Everything you need to grow and scale.' },
  { Icon: Headphones, title: 'Dedicated Support', desc: 'Our team is here 24/7 for you.' },
] as const

/* ─────────────────────────── page ─────────────────────────── */

export default async function HomePage({ searchParams }: { searchParams: { code?: string } }) {
  if (searchParams.code) redirect(`/auth/callback?code=${searchParams.code}`)

  const marketplaceOpen = await getMarketplaceOpen()

  return (
    <>
      {/* ═══ OPENING SOON ANNOUNCEMENT (pre-opening) ═══ */}
      {!marketplaceOpen && (
        <div className="bg-gradient-to-r from-[#F5A623] to-[#fbbf24] text-[#0B1F4D]">
          <div className="container mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-center gap-x-3 gap-y-1 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-sm">
              <span className="w-2 h-2 rounded-full bg-[#0B1F4D] animate-pulse" /> OPENING SOON
            </span>
            <span className="text-[13px] font-medium leading-snug">
              TTAI EMA is a global B2B trade marketplace launching soon. Businesses can <strong>register now and build their shop</strong> ahead of opening — verification, B2B access and promotions start on launch day.
            </span>
            <Link href="/register" className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#0B1F4D] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#162d6e] transition-colors mx-auto sm:mx-0">
              Reserve your shop →
            </Link>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[#0a1733]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-3/5">
          <Image src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80" alt="" fill priority
            className="object-cover opacity-60" sizes="60vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1733] via-[#0a1733]/85 to-transparent" />
        </div>
        <div className="absolute -top-32 -left-20 w-[480px] h-[480px] rounded-full bg-[#F5A623]/10 blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl py-20 sm:py-28">
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight">
              Global Trade Network<br />Powered by <span className="text-[#F5A623]">TTAI EMA</span>
            </h1>
            <p className="mt-5 text-lg text-blue-100/80 max-w-md leading-relaxed">
              Factories, Suppliers, Distributors and Retailers Connected in One Smart Ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-lg shadow-[#F5A623]/20">
                Explore Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/25 text-white px-6 py-3.5 text-sm font-bold hover:bg-white/10 transition-colors backdrop-blur-sm">
                Become a Supplier
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-blue-100/70">
              {[
                { Icon: ShieldCheck, t: 'Verified Suppliers' }, { Icon: Lock, t: 'Secure Transactions' },
                { Icon: Globe2, t: 'Global Support' }, { Icon: Clock, t: '24/7 Assistance' },
              ].map(({ Icon, t }) => (
                <span key={t} className="flex items-center gap-2"><Icon className="w-4 h-4 text-[#F5A623]" />{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CHOOSE YOUR MARKETPLACE ═══ */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0B1F4D]/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0B1F4D] mb-3">
              <Zap className="w-4 h-4 text-[#F5A623]" /> Three Channels, One Login
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">Choose Your Marketplace</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto">From a single piece to a full truckload — trade at any scale across one powerful ecosystem.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHANNELS.map((c, i) => {
              const locked = (c as any).locked as boolean | undefined
              const inner = (
                <>
                  {/* giant ghost icon */}
                  <c.Icon className="absolute -bottom-8 -right-5 w-48 h-48 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" strokeWidth={1.25} />
                  {!locked && <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />}

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur flex items-center justify-center shadow-inner">
                        <c.Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="rounded-full bg-white/20 border border-white/25 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                        {locked ? 'Coming Soon' : c.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl font-extrabold text-white">{c.title}</h3>
                    <p className="text-white font-bold text-sm mt-0.5">{c.sub}</p>
                    <p className="text-white/75 text-sm mt-2 leading-relaxed">{c.desc}</p>

                    <ul className="mt-5 space-y-2">
                      {c.tags.map((t) => (
                        <li key={t} className="flex items-center gap-2 text-sm font-medium text-white/90">
                          <CheckCircle2 className="w-4 h-4 text-white/80 flex-shrink-0" /> {t}
                        </li>
                      ))}
                    </ul>

                    <span className={`mt-7 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-extrabold shadow-sm transition-all ${locked ? 'bg-white/20 text-white/80 border border-white/25' : `bg-white ${c.btn} group-hover:gap-2.5`}`}>
                      {locked ? <>🔒 Coming Soon</> : <>{c.cta} <ArrowRight className="w-4 h-4" /></>}
                    </span>
                  </div>
                </>
              )
              const base = `group relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${c.grad} p-7 shadow-lg ring-1 ring-white/10 transition-all duration-300`
              return (
                <Reveal key={c.title} from="up" delay={i * 90}>
                  {locked
                    ? <div className={`${base} opacity-70 cursor-not-allowed`} aria-disabled>{inner}</div>
                    : <Link href={c.href} className={`${base} hover:-translate-y-2 hover:shadow-2xl`}>{inner}</Link>}
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ SHOP BY REGION ═══ */}
      <RegionChooser />

      {/* ═══ WHY TTAI EMA ═══ */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">Why TTAI EMA?</h2>
            <p className="text-gray-400 mt-2">Everything you need to grow your business globally.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {WHY.map((w, i) => (
              <Reveal key={w.title} from="up" delay={i * 60}>
                <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 text-center hover:shadow-lg hover:border-[#F5A623]/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-3">
                    <w.Icon className="w-6 h-6 text-[#F5A623]" />
                  </div>
                  <h3 className="font-extrabold text-[#0B1F4D] text-sm mb-1.5">{w.title}</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ONE SUPPLIER — THREE SALES CHANNELS ═══ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">One Supplier — Three Sales Channels</h2>
            <p className="text-gray-400 mt-2">One profile can sell through three different channels simultaneously.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* chain + channels */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-center gap-1 sm:gap-3 mb-8 flex-wrap">
                {CHAIN.map((n, i) => (
                  <div key={n.label} className="flex items-center gap-1 sm:gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#0B1F4D] flex items-center justify-center text-[#0B1F4D]">
                        <n.Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[#0B1F4D] mt-1.5">{n.label}</span>
                    </div>
                    {i < CHAIN.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 mb-5" />}
                  </div>
                ))}
              </div>
              <div className="space-y-2.5 max-w-md mx-auto">
                {SALES.map((s) => (
                  <div key={s.title} className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${s.grad} px-4 py-3`}>
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <s.Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white leading-tight">{s.title}</p>
                      <p className="text-[11px] text-white/70">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* success card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
              <ul className="space-y-3 mb-5">
                {['More visibility', 'More buyers', 'More orders', 'More growth'].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm font-semibold text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <span className="text-xl font-black text-[#0B1F4D]">More Success</span>
                <TrendingUp className="w-6 h-6 text-[#F5A623]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GLOBAL NETWORK ═══ */}
      <section className="py-12 px-4 bg-[#0B1F4D]">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white mb-8">Our Global Network</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 divide-x divide-white/10">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3 justify-center px-2">
                <s.Icon className="w-8 h-8 text-[#F5A623] flex-shrink-0" strokeWidth={1.5} />
                <div>
                  {s.value && <p className="text-2xl font-black text-white leading-none">{s.value}</p>}
                  <p className="text-xs text-blue-200/70 font-semibold whitespace-pre-line mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUSTED SUPPLIERS & BRANDS ═══ */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Trusted Suppliers &amp; Brands</h2>
            <Link href="/suppliers" className="text-sm font-bold text-[#F5A623] hover:underline flex items-center gap-1">
              View all suppliers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {BRANDS.map((b) => (
              <Link key={b.name} href="/suppliers" className="rounded-2xl border border-gray-100 bg-white p-4 text-center hover:shadow-md hover:border-[#0B1F4D]/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] flex items-center justify-center mx-auto mb-2.5 text-white font-black text-sm">
                  {b.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </div>
                <p className="font-extrabold text-[#0B1F4D] text-xs leading-tight">{b.name}</p>
                <p className="text-[11px] text-gray-400 mb-2">{b.place}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-bold">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BUSINESS CHANNELS ═══ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* phone mockup */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-64 rounded-[2rem] border-[6px] border-[#0B1F4D] bg-[#0B1F4D] shadow-2xl overflow-hidden">
                <div className="bg-[#0B1F4D] px-4 py-3 flex items-center justify-between text-white">
                  <span className="text-sm font-bold flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-[#F5A623]" /> TTAI Channels</span>
                </div>
                <div className="bg-gray-50 p-3 space-y-2">
                  {FEED.map((f) => (
                    <div key={f.title} className="bg-white rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${f.color}`}>
                        <f.Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-gray-800 leading-tight">{f.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{f.sub}</p>
                      </div>
                      <span className="text-[9px] text-gray-300 flex-shrink-0">{f.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* copy */}
            <div className="lg:col-span-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5A623]/10 text-[#a9690b] px-3 py-1 text-xs font-bold mb-3">
                <Zap className="w-3 h-3" /> Stay Connected
              </span>
              <h2 className="text-3xl font-extrabold text-[#0B1F4D] mb-3">Business Channels</h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                Receive supplier offers directly without WhatsApp chaos or email overload.
              </p>
              <ul className="space-y-2.5 mb-6">
                {['Real-time product updates', 'Exclusive offers & discounts', 'Stock & shipment notifications', 'All your channels in one inbox'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/channels" className="inline-flex items-center gap-2 rounded-xl bg-[#5b3fd6] text-white px-6 py-3 text-sm font-bold hover:bg-[#4d35b8] transition-colors">
                Discover Channels <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* chips */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {CHIPS.map((c) => (
                <div key={c.title} className="rounded-2xl border border-gray-100 bg-white p-4">
                  <c.Icon className={`w-5 h-5 mb-2 ${c.color}`} />
                  <p className="font-extrabold text-[#0B1F4D] text-xs">{c.title}</p>
                  <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUSTED GLOBAL COMMERCE ═══ */}
      <section className="py-12 px-4 bg-white border-y border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-xs font-black uppercase tracking-widest text-gray-400 mb-7">Trusted Global Commerce</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {PAYMENTS.map((p) => (
              <span key={p.label} className={`text-xl sm:text-2xl font-black ${p.cls} opacity-80 hover:opacity-100 transition-opacity`}>{p.label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ READY TO GROW ═══ */}
      <section className="py-16 px-4 bg-[#0a1733] relative overflow-hidden">
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full bg-[#F5A623]/10 blur-3xl" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Ready To Grow Your Business?</h2>
              <p className="text-blue-100/70 mb-7">Join the next generation of international trade.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">
                  Join as Supplier <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/25 text-white px-6 py-3.5 text-sm font-bold hover:bg-white/10 transition-colors">
                  Explore Marketplace
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {GROW.map((g) => (
                <div key={g.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <g.Icon className="w-5 h-5 text-[#F5A623]" />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm">{g.title}</p>
                    <p className="text-xs text-blue-100/60 leading-relaxed mt-0.5">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
