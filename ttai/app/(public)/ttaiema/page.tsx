import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Truck, Boxes, ShoppingCart, Globe2, Warehouse, ArrowRight, Check, Package, Building2, MessageCircle,
} from 'lucide-react'

export const metadata = { title: 'About TTAIEMA · Dropshipping, E-commerce & Trade' }

const PLANS = [
  { Icon: Truck, title: 'Drop Shipping', desc: 'We hold the stock and ship orders straight to your customers under your shop — you sell, we fulfil.', accent: '#F5A623' },
  { Icon: ShoppingCart, title: 'E-commerce', desc: 'Ready-made online & retail stores. List our goods in your shop and sell by the piece with home delivery.', accent: '#8b5cf6' },
  { Icon: Boxes, title: 'Wholesale (B2B)', desc: 'Buy our brands by the box, pallet or truck at wholesale prices — for shops, distributors and resellers.', accent: '#2563eb' },
  { Icon: Warehouse, title: 'Hub Logistics', desc: 'Warehousing, fulfilment and shipping across Europe (DHL · GLS · FedEx). One hub, every order handled.', accent: '#10b981' },
]

const STEPS = [
  { n: 1, t: 'Pick our products', d: 'Choose from our own brands in the Trade Hub.' },
  { n: 2, t: 'Sell on your channel', d: 'Online to end users, or B2B to businesses — your price.' },
  { n: 3, t: 'We fulfil & ship', d: 'TTAIEMA holds stock, ships the order and handles logistics.' },
  { n: 4, t: 'You keep the margin', d: 'The difference between your price and ours is your profit.' },
]

export default async function TtaiemaProfilePage() {
  const supabase = createClient()
  const { data: brands } = await (supabase.from('suppliers') as any)
    .select('trade_name, brand_slug, logo_url')
    .eq('is_house', true).eq('status', 'ACTIVE')
    .order('reliability_tier', { ascending: true })
    .limit(12)

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0B1F4D] to-[#162d6e] text-white">
        <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[11px] font-extrabold px-3 py-1 mb-4">
            <Building2 className="w-3.5 h-3.5" /> ABOUT TTAIEMA
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Your dropshipping &amp; trade partner</h1>
          <p className="text-blue-100/80 mt-4 max-w-2xl mx-auto text-lg">
            TTAIEMA owns and supplies its own brands — and ships them for you. Sell our products
            <span className="font-semibold text-white"> online to end users</span> or
            <span className="font-semibold text-white"> wholesale to businesses</span>; we handle stock, fulfilment and logistics.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/b2b" className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">
              Explore the Trade Hub <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/logistics" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10 transition-colors">
              <MessageCircle className="w-4 h-4" /> Talk to logistics
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto max-w-6xl px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">What we do</h2>
          <p className="text-gray-400 mt-2">Four ways to grow with TTAIEMA.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((p) => (
            <div key={p.title} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${p.accent}14`, color: p.accent }}>
                <p.Icon className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0B1F4D] mb-1.5">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our brands */}
      {brands && brands.length > 0 && (
        <section className="bg-gray-50 py-14">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Our brands</h2>
              <p className="text-gray-400 mt-2">We sell these ourselves — and you can too.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {brands.map((b: any) => {
                const initials = (b.trade_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <Link key={b.brand_slug || b.trade_name} href={b.brand_slug ? `/brand/${b.brand_slug}` : '/b2b'}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 rounded-full mx-auto mb-2.5 overflow-hidden bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] flex items-center justify-center text-white font-black text-sm">
                      {b.logo_url ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={b.logo_url} alt={b.trade_name} className="w-full h-full object-cover" />) : initials}
                    </div>
                    <p className="font-extrabold text-[#0B1F4D] text-xs leading-tight line-clamp-2">{b.trade_name}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">How dropshipping works with us</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-[#0B1F4D] text-white text-sm font-black flex items-center justify-center shadow">{s.n}</span>
              <h3 className="font-extrabold text-[#0B1F4D] mt-3 mb-1">{s.t}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#0B1F4D] to-[#162d6e] text-white p-10 text-center">
          <Globe2 className="w-10 h-10 mx-auto text-[#F5A623] mb-3" />
          <h2 className="text-2xl sm:text-3xl font-black">Start selling our products today</h2>
          <p className="text-blue-100/80 mt-2 max-w-xl mx-auto">Pick a channel — Online for end users or B2B for businesses — and we&apos;ll handle the rest.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/b2b" className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">
              <Package className="w-4 h-4" /> Open the Trade Hub
            </Link>
            <Link href="/store" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10 transition-colors">
              <ShoppingCart className="w-4 h-4" /> Shop Online
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
