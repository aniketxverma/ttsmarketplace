'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Star, ShieldCheck, Crown, MessageCircle, Truck, Check } from 'lucide-react'

export type Seller = {
  productId: string
  slug: string
  href: string
  productPriceCents: number
  shippingCents: number | null
  totalCents: number
  currency: string
  condition: string | null
  region: string | null
  customsNote: string
  customsOk: boolean
  deliveryDays: number | null
  leadTime: string | null
  stock: number
  city: string | null
  country: string | null
  flag: string
  supplierName: string
  verified: boolean
  premium: boolean
  tierLabel: string
  whatsapp: string | null
  brandSlug: string | null
  nearby: boolean
}

const SORTS = [
  { id: 'best', label: 'Best Price' },
  { id: 'delivery', label: 'Fastest Delivery' },
  { id: 'rating', label: 'Top Supplier' },
] as const

const TIER_RANK: Record<string, number> = { Premium: 0, Verified: 1, Supplier: 2 }
const PAGE = 4

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
}

export function SellersTable({ sellers, productName }: { sellers: Seller[]; productName: string }) {
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('best')
  const [expanded, setExpanded] = useState(false)

  const bestPriceId = useMemo(
    () => sellers.reduce<{ id: string | null; t: number }>((a, s) => (s.totalCents < a.t ? { id: s.productId, t: s.totalCents } : a), { id: null, t: Infinity }).id,
    [sellers],
  )

  const sorted = useMemo(() => {
    const list = sellers.slice()
    if (sort === 'best') list.sort((a, b) => a.totalCents - b.totalCents)
    else if (sort === 'delivery') list.sort((a, b) => (a.deliveryDays ?? 999) - (b.deliveryDays ?? 999))
    else if (sort === 'rating') list.sort((a, b) => (TIER_RANK[a.tierLabel] ?? 2) - (TIER_RANK[b.tierLabel] ?? 2))
    return list
  }, [sellers, sort])

  const shown = expanded ? sorted : sorted.slice(0, PAGE)
  const remaining = sorted.length - shown.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-[#0B1F4D]">Available Sellers ({sellers.length})</h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 font-medium">Sort by:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Header (desktop) */}
      <div className="hidden lg:grid grid-cols-[1.4fr_0.8fr_1.3fr_1.1fr_1fr_0.9fr] gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 border-b">
        <span>Supplier</span><span>Location</span><span>Offer Details</span><span>Price Details</span><span>Delivery</span><span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-gray-100">
        {shown.map((s) => {
          const isBest = s.productId === bestPriceId
          return (
            <div key={s.productId} className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr_1.3fr_1.1fr_1fr_0.9fr] gap-3 px-4 py-4 items-center hover:bg-gray-50/60">
              {/* Supplier */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col gap-1">
                  {isBest && <span className="inline-flex items-center justify-center rounded bg-green-600 text-white text-[9px] font-extrabold px-1.5 py-0.5">BEST PRICE</span>}
                  {s.premium && !isBest && <span className="inline-flex items-center justify-center rounded bg-[#0B1F4D] text-white text-[9px] font-extrabold px-1.5 py-0.5">PREMIUM</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B1F4D] to-[#2563eb] text-white flex items-center justify-center text-sm font-extrabold flex-shrink-0">
                  {s.supplierName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#0B1F4D] text-sm truncate">{s.supplierName}</p>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${s.premium ? 'text-amber-600' : 'text-green-600'}`}>
                    {s.premium ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}{s.tierLabel}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="text-sm">
                <span className="text-xl leading-none mr-1">{s.flag}</span>
                <div className="text-xs text-gray-600 mt-0.5">{[s.city, s.country].filter(Boolean).join(', ') || '—'}</div>
                {s.nearby && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-0.5">Near you</span>}
              </div>

              {/* Offer details */}
              <div className="text-xs text-gray-600 space-y-0.5">
                {s.condition && <div><span className="text-gray-400">Condition:</span> <span className="font-semibold text-gray-800">{s.condition}</span></div>}
                {s.region && <div><span className="text-gray-400">Region:</span> <span className="font-semibold text-gray-800">{s.region}</span></div>}
                <div className={`font-semibold ${s.customsOk ? 'text-green-600' : 'text-amber-600'}`}>{s.customsNote}</div>
              </div>

              {/* Price details */}
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between gap-2"><span className="text-gray-400">Product</span><span className="font-semibold text-gray-800">{money(s.productPriceCents, s.currency)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-400">Shipping</span><span className="font-semibold text-gray-800">{s.shippingCents == null ? 'At checkout' : s.shippingCents === 0 ? 'Free' : money(s.shippingCents, s.currency)}</span></div>
                <div className="flex justify-between gap-2 pt-0.5 border-t border-gray-100"><span className="text-gray-500 font-bold">Total</span><span className={`font-extrabold ${isBest ? 'text-green-600' : 'text-[#0B1F4D]'}`}>{money(s.totalCents, s.currency)}</span></div>
              </div>

              {/* Delivery */}
              <div className="text-xs">
                <div className="inline-flex items-center gap-1 font-bold text-[#0B1F4D]"><Truck className="w-3.5 h-3.5" />{s.deliveryDays != null ? `${s.deliveryDays} day${s.deliveryDays === 1 ? '' : 's'}` : (s.leadTime || '—')}</div>
                <div className={`mt-0.5 ${s.stock > 0 ? 'text-green-600' : 'text-red-500'} font-semibold`}>{s.stock > 0 ? `${s.stock} in stock` : 'Out of stock'}</div>
              </div>

              {/* Action */}
              <div className="flex flex-col items-stretch lg:items-end gap-1.5">
                <Link href={s.href} className="inline-flex items-center justify-center rounded-lg bg-[#0B1F4D] text-white px-4 py-2 text-xs font-extrabold hover:bg-[#162d6e] whitespace-nowrap">
                  View &amp; Order
                </Link>
                {(s.whatsapp || s.brandSlug) && (
                  <a
                    href={s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I am interested in: ' + productName)}` : `/brand/${s.brandSlug}`}
                    target={s.whatsapp ? '_blank' : undefined} rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#2563eb] hover:underline"
                  >
                    <MessageCircle className="w-3 h-3" /> Chat with Supplier
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {remaining > 0 && (
        <div className="text-center mt-4">
          <button onClick={() => setExpanded(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D]">
            View More Suppliers ({remaining}) ▾
          </button>
        </div>
      )}
    </div>
  )
}
