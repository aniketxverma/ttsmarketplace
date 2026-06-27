import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { Truck, Boxes, ShoppingCart, ArrowRight, Check, ShieldCheck, Store } from 'lucide-react'

export const metadata = { title: 'TTAIEMA Trade Hub · B2B & Online' }

/**
 * TTAIEMA Trade Hub — our OWN goods (Bullz, Hudarom/Café, Rozil…) sold dropship.
 * Two entry cards: B2B (wholesale) and Online (end-user retail). Role-aware:
 * end-users are nudged to Online, registered suppliers to B2B.
 */
export default async function TradeHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role: string | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = (data as any)?.role ?? null
  }
  const isBusiness = role === 'supplier' || role === 'broker' || role === 'business_client' || role === 'admin'

  const tt = await localizeUI([
    'TTAIEMA TRADE HUB', 'Our own goods — sold two ways', 'How dropshipping works with us', 'Recommended for you',
    "The Trade Hub is TTAIEMA's own brands (Bullz, Hudarom Café, Rozil and more), sold dropship: we hold the stock, ship the order and handle payment. Choose how you want to buy.",
    'Online — for End Users', 'Retail price', 'Buy our products by the piece or box, delivered to your door. Pay online — fulfilled and shipped directly by TTAIEMA.',
    'Single units & small packs', 'Retail price (all-in)', 'Fast home delivery', 'Shop Online',
    'B2B — for Businesses', 'Wholesale price', 'Buy our goods by the box, pallet or truck at wholesale prices. For shops, distributors and resellers — register to unlock B2B pricing.',
    'Box · Pallet · Truck', 'Drop-ship to your customers', 'Shop B2B',
    'Fulfilled by TTAIEMA', 'One supplier, dual pricing', 'Drop-shipping ready',
  ], getLocale())

  const cards = [
    {
      key: 'online', highlight: !isBusiness, Icon: ShoppingCart,
      title: 'Online — for End Users', tag: 'Retail price',
      desc: 'Buy our products by the piece or box, delivered to your door. Pay online — fulfilled and shipped directly by TTAIEMA.',
      bullets: ['Single units & small packs', 'Retail price (all-in)', 'Fast home delivery'],
      href: '/store?hub=ttaiema', cta: 'Shop Online', grad: 'from-violet-600 to-purple-700',
    },
    {
      key: 'b2b', highlight: isBusiness, Icon: Boxes,
      title: 'B2B — for Businesses', tag: 'Wholesale price',
      desc: 'Buy our goods by the box, pallet or truck at wholesale prices. For shops, distributors and resellers — register to unlock B2B pricing.',
      bullets: ['Box · Pallet · Truck', 'Wholesale price', 'Drop-ship to your customers'],
      href: '/marketplace?hub=ttaiema', cta: 'Shop B2B', grad: 'from-blue-600 to-[#0B1F4D]',
    },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0B1F4D] to-[#162d6e] text-white">
        <div className="container mx-auto max-w-5xl px-4 py-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[11px] font-extrabold px-3 py-1 mb-4">
            <Truck className="w-3.5 h-3.5" /> {tt('TTAIEMA TRADE HUB')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{tt('Our own goods — sold two ways')}</h1>
          <p className="text-blue-100/80 mt-3 max-w-2xl mx-auto">
            {tt("The Trade Hub is TTAIEMA's own brands (Bullz, Hudarom Café, Rozil and more), sold dropship: we hold the stock, ship the order and handle payment. Choose how you want to buy.")}
          </p>
          <Link href="/ttaiema" className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-[#F5A623] hover:underline">
            {tt('How dropshipping works with us')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Two cards */}
      <section className="container mx-auto max-w-5xl px-4 -mt-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c) => (
            <Link key={c.key} href={c.href}
              className={`group relative rounded-3xl bg-white border shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all ${c.highlight ? 'border-[#F5A623] ring-2 ring-[#F5A623]/30' : 'border-gray-100'}`}>
              {c.highlight && (
                <span className="absolute top-4 right-4 z-10 rounded-full bg-[#F5A623] text-[#0B1F4D] text-[10px] font-extrabold px-2.5 py-1">{tt('Recommended for you')}</span>
              )}
              <div className={`h-2 bg-gradient-to-r ${c.grad}`} />
              <div className="p-7">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-white mb-4`}>
                  <c.Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-extrabold text-[#0B1F4D]">{tt(c.title)}</h2>
                </div>
                <span className="inline-block rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 mb-3">{tt(c.tag)}</span>
                <p className="text-sm text-gray-500 leading-relaxed">{tt(c.desc)}</p>
                <ul className="mt-4 space-y-1.5">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />{tt(b)}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F4D] text-white px-5 py-3 text-sm font-bold group-hover:bg-[#162d6e] transition-colors">
                  {tt(c.cta)} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#0B1F4D]" /> {tt('Fulfilled by TTAIEMA')}</span>
          <span className="inline-flex items-center gap-1.5"><Store className="w-4 h-4 text-[#0B1F4D]" /> {tt('One supplier, dual pricing')}</span>
          <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#0B1F4D]" /> {tt('Drop-shipping ready')}</span>
        </div>
      </section>
    </div>
  )
}
