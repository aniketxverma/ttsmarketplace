'use client'

import { useCart } from '@/lib/cart/CartContext'
import { MapPin, Truck, ShieldCheck, Crown, Award, Check, Store } from 'lucide-react'

export type Offer = {
  productId: string
  slug: string
  name: string
  priceCents: number
  currency: string
  stock: number
  condition: string | null
  warranty: string | null
  warehouse: string | null
  deliveryDays: number | null
  leadTime: string | null
  location: string | null
  supplierName: string
  supplierId: string
  tier: string
  imageUrl?: string
  minOrderQty: number
}

const TIER_BADGE: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  GOLD:   { label: 'Gold',   cls: 'bg-amber-100 text-amber-800',  Icon: Crown },
  SILVER: { label: 'Verified', cls: 'bg-slate-100 text-slate-700', Icon: ShieldCheck },
  BRONZE: { label: 'Bronze', cls: 'bg-orange-100 text-orange-800', Icon: Award },
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

export function OfferList({ offers }: { offers: Offer[] }) {
  const { addItem } = useCart()

  function buy(o: Offer) {
    addItem({
      productId: o.productId,
      name: o.name,
      price_cents: o.priceCents,
      currency_code: o.currency,
      imageUrl: o.imageUrl,
      supplierName: o.supplierName,
      supplierId: o.supplierId,
      min_order_qty: o.minOrderQty,
    }, Math.max(1, o.minOrderQty))
  }

  return (
    <div className="space-y-3">
      {offers.map((o, i) => {
        const best = i === 0
        const tier = TIER_BADGE[o.tier]
        return (
          <div key={o.productId}
            className={`rounded-2xl border bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${best ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-100'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-[#0B1F4D] truncate">{o.supplierName || 'Supplier'}</span>
                {tier && <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tier.cls}`}><tier.Icon className="w-2.5 h-2.5" />{tier.label}</span>}
                {best && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700"><Check className="w-2.5 h-2.5" />Best price</span>}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-500 mt-1">
                {o.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{o.location}</span>}
                {(o.deliveryDays != null || o.leadTime) && <span className="inline-flex items-center gap-1"><Truck className="w-3 h-3" />{o.deliveryDays != null ? `${o.deliveryDays} day${o.deliveryDays === 1 ? '' : 's'}` : o.leadTime}</span>}
                {o.condition && <span className="inline-flex items-center gap-1"><Store className="w-3 h-3" />{o.condition}</span>}
                {o.warranty && <span>{o.warranty} warranty</span>}
                <span className={o.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>{o.stock > 0 ? `${o.stock} in stock` : 'Out of stock'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-lg font-extrabold text-[#0B1F4D]">{money(o.priceCents, o.currency)}</span>
              <button onClick={() => buy(o)} disabled={o.stock <= 0}
                className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] disabled:opacity-40 disabled:cursor-not-allowed">
                Add to cart
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
