'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Crown, MessageCircle, Truck, Lock, MapPin, Package, Check, ChevronDown } from 'lucide-react'
import type { Seller } from '@/lib/offers'

export type { Seller }

const SORTS = [
  { id: 'best', label: 'Best Price' },
  { id: 'delivery', label: 'Fastest Delivery' },
  { id: 'rating', label: 'Top Supplier' },
] as const

const TIER_RANK: Record<string, number> = { Premium: 0, Verified: 1, Supplier: 2 }
const PAGE = 4

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)
}

export function SellersTable({ sellers, productName, locked = false }: { sellers: Seller[]; productName: string; locked?: boolean }) {
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('best')
  const [expanded, setExpanded] = useState(false)
  const blur = 'blur-[5px] select-none pointer-events-none'

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
      {/* Heading */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-[#0B1F4D] leading-tight">Available Sellers</h2>
          <p className="text-xs text-gray-400 mt-0.5">{sellers.length} supplier{sellers.length === 1 ? '' : 's'} competing for this product</p>
        </div>
        <label className="flex items-center gap-2 text-sm flex-shrink-0">
          <span className="text-gray-400 font-medium hidden sm:inline">Sort by</span>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 py-2 text-sm font-bold text-[#0B1F4D] cursor-pointer hover:border-[#0B1F4D]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>
      </div>

      {locked && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Lock className="w-4 h-4 text-amber-600" /></div>
            <p className="text-sm text-amber-900 leading-snug">
              <span className="font-extrabold">{sellers.length} verified supplier{sellers.length === 1 ? '' : 's'}</span> competing here. Prices are public — unlock <span className="font-bold">names, locations &amp; contact</span> to order.
            </p>
          </div>
          <Link href="/pricing" className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[#162d6e] transition-colors whitespace-nowrap shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Unlock suppliers
          </Link>
        </div>
      )}

      {/* Column header (desktop) */}
      <div className="hidden lg:grid grid-cols-[1.7fr_1fr_1.25fr_1.05fr_1fr_auto] gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        <span>Supplier</span><span>Location</span><span>Offer</span><span>Price</span><span>Delivery</span><span className="text-right pr-1">Action</span>
      </div>

      <div className="space-y-2.5">
        {shown.map((s) => {
          const isBest = s.productId === bestPriceId
          return (
            <div key={s.productId}
              className={`group relative rounded-2xl border p-4 transition-all duration-150 lg:grid lg:grid-cols-[1.7fr_1fr_1.25fr_1.05fr_1fr_auto] gap-4 lg:items-center flex flex-col gap-3
                ${isBest ? 'border-green-300 bg-green-50/40 ring-1 ring-green-100' : 'border-gray-200 hover:border-[#0B1F4D]/30 hover:shadow-md'}`}>
              {isBest && <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-green-500" />}

              {/* Supplier */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-extrabold flex-shrink-0 text-white shadow-sm ${isBest ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-[#0B1F4D] to-[#2563eb]'}`}>
                  {locked ? <Lock className="w-4 h-4" /> : s.supplierName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`font-extrabold text-[#0B1F4D] text-sm leading-tight ${locked ? blur : ''}`}>{locked ? 'Verified Supplier Co.' : s.supplierName}</p>
                    {isBest && <span className="inline-flex items-center gap-0.5 rounded-md bg-green-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 leading-none"><Check className="w-2.5 h-2.5" />BEST</span>}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-1 px-1.5 py-0.5 rounded-md ${s.premium ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {s.premium ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}{s.tierLabel}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex lg:block items-center gap-2">
                <span className="lg:hidden text-[10px] font-bold uppercase text-gray-400 w-16 flex-shrink-0">Location</span>
                <div>
                  <div className={`flex items-center gap-1.5 ${locked ? blur : ''}`}>
                    <span className="text-lg leading-none">{s.flag}</span>
                    <span className="text-sm font-bold text-[#0B1F4D]">{locked ? 'ES' : (s.country ?? '—')}</span>
                  </div>
                  <p className={`text-[11px] text-gray-400 mt-0.5 ${locked ? blur : ''}`}>{locked ? 'Madrid' : (s.city ?? '')}</p>
                  {!locked && s.nearby && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 mt-0.5"><MapPin className="w-2.5 h-2.5" />Near you</span>}
                </div>
              </div>

              {/* Offer */}
              <div className="flex lg:block items-start gap-2 text-xs">
                <span className="lg:hidden text-[10px] font-bold uppercase text-gray-400 w-16 flex-shrink-0 pt-0.5">Offer</span>
                <div className="space-y-0.5">
                  {s.condition && <p className="text-gray-700"><span className="text-gray-400">Condition</span> · <span className="font-bold">{s.condition}</span></p>}
                  {s.region && <p className="text-gray-700"><span className="text-gray-400">Region</span> · <span className="font-bold">{s.region}</span></p>}
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${s.customsOk ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {s.customsOk ? <Check className="w-2.5 h-2.5" /> : '⚠'} {s.customsNote}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex lg:block items-center gap-2">
                <span className="lg:hidden text-[10px] font-bold uppercase text-gray-400 w-16 flex-shrink-0">Price</span>
                <div className="w-full">
                  <div className="flex items-baseline justify-between lg:justify-start gap-2">
                    <span className={`text-lg font-extrabold ${isBest ? 'text-green-600' : 'text-[#0B1F4D]'}`}>{money(s.totalCents, s.currency)}</span>
                    <span className="text-[10px] text-gray-400 font-medium">total</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    {money(s.productPriceCents, s.currency)} + {s.shippingCents == null ? 'shipping at checkout' : s.shippingCents === 0 ? 'free shipping' : money(s.shippingCents, s.currency) + ' ship'}
                  </p>
                </div>
              </div>

              {/* Delivery */}
              <div className="flex lg:block items-center gap-2">
                <span className="lg:hidden text-[10px] font-bold uppercase text-gray-400 w-16 flex-shrink-0">Delivery</span>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-[#0B1F4D]">
                    <Truck className="w-3.5 h-3.5" />{s.deliveryDays != null ? `${s.deliveryDays} day${s.deliveryDays === 1 ? '' : 's'}` : (s.leadTime || '—')}
                  </span>
                  <p className={`flex items-center gap-1 text-[11px] font-semibold mt-1 ${s.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    {s.stock > 0 ? `${s.stock.toLocaleString('es-ES')} in stock` : 'Out of stock'}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col items-stretch lg:items-end gap-1.5 lg:min-w-[130px]">
                {locked ? (
                  <Link href="/pricing" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-4 py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors whitespace-nowrap shadow-sm">
                    <Lock className="w-3.5 h-3.5" /> Unlock
                  </Link>
                ) : (
                  <>
                    <Link href={s.href} className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold transition-colors whitespace-nowrap shadow-sm ${isBest ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]'}`}>
                      View &amp; Order
                    </Link>
                    {(s.whatsapp || s.brandSlug) && (
                      <a
                        href={s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I am interested in: ' + productName)}` : `/brand/${s.brandSlug}`}
                        target={s.whatsapp ? '_blank' : undefined} rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-gray-500 hover:text-[#2563eb] transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" /> Chat with supplier
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {remaining > 0 && (
        <div className="text-center mt-5">
          <button onClick={() => setExpanded(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D] hover:shadow-sm transition-all">
            View {remaining} more supplier{remaining === 1 ? '' : 's'} <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
