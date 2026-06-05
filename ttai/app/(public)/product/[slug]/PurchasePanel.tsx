'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import { Package, Box, Layers, Truck, ShoppingCart, FileText, Check } from 'lucide-react'
import {
  availableUnits, piecesIn, cartonsIn, unitPrice, unitsPerPallet,
  UNIT_LABEL, type PurchaseUnit, type PackagingProduct,
} from '@/lib/packaging'

const UNIT_ICON: Record<PurchaseUnit, typeof Box> = {
  piece: Package, box: Box, pallet: Layers, truck: Truck,
}
const UNIT_ACCENT: Record<PurchaseUnit, string> = {
  piece: '#16a34a', box: '#0B1F4D', pallet: '#7c3aed', truck: '#ea580c',
}
const UNIT_SUB: Record<PurchaseUnit, string> = {
  piece: 'Sold individually', box: 'By the carton', pallet: 'For businesses & distributors', truck: 'Full load, best price',
}

type Product = PackagingProduct & {
  id: string; name: string; slug: string; currency_code: string
}

export function PurchasePanel({
  product, retail = false, whatsapp, supplierName, imageUrl, disabled, shopUnits,
}: {
  product: Product
  retail?: boolean
  whatsapp?: string | null
  supplierName: string
  imageUrl?: string
  disabled?: boolean
  /** Restrict to the units this shop allows (Phase 3). Undefined = all available. */
  shopUnits?: PurchaseUnit[]
}) {
  const allUnits = availableUnits(product)
  const units = shopUnits ? allUnits.filter(u => shopUnits.includes(u)) : allUnits
  const { addItem } = useCart()
  const router = useRouter()
  const [unit, setUnit] = useState<PurchaseUnit>(units[0] ?? 'piece')
  const [qty, setQty_] = useState(1)
  const [added, setAdded] = useState(false)

  const fmt = (cents: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: product.currency_code }).format(cents / 100)
  const num = (n: number) => new Intl.NumberFormat('es-ES').format(n)

  if (units.length === 0) {
    return <p className="text-sm text-gray-400">This product is not available for purchase right now.</p>
  }

  const pieces  = piecesIn(product, unit) * qty
  const cartons = cartonsIn(product, unit) * qty
  const pallets = unit === 'truck' ? (product.pallets_per_truck ?? 0) * qty : unit === 'pallet' ? qty : 0
  const lineTotal = unitPrice(product, unit, retail) * qty

  const canQuote = unit === 'pallet' || unit === 'truck'

  function addToCart() {
    addItem({
      productId: product.id,
      unit,
      unitLabel: UNIT_LABEL[unit],
      name: product.name,
      price_cents: unitPrice(product, unit, retail), // price for ONE of this unit
      currency_code: product.currency_code,
      imageUrl, supplierName, retail,
    }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function requestQuote() {
    const msg = `Hi ${supplierName}, I'd like a quote for ${qty} ${UNIT_LABEL[unit].toLowerCase()}${qty > 1 ? 's' : ''} of "${product.name}" (${num(pieces)} units).`
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      router.push(`/marketplace`)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Unit selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {units.map((u) => {
          const Icon = UNIT_ICON[u]
          const active = u === unit
          return (
            <button key={u} type="button" onClick={() => { setUnit(u); setQty_(1) }}
              className={`relative rounded-xl border p-3 text-left transition-all ${
                active ? 'border-transparent ring-2 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={active ? { ['--tw-ring-color' as any]: UNIT_ACCENT[u] } : undefined}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ background: `${UNIT_ACCENT[u]}1a`, color: UNIT_ACCENT[u] }}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm font-extrabold text-[#0B1F4D]">{UNIT_LABEL[u]}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{UNIT_SUB[u]}</p>
              <p className="text-xs font-bold mt-1.5" style={{ color: UNIT_ACCENT[u] }}>{fmt(unitPrice(product, u, retail))}</p>
            </button>
          )
        })}
      </div>

      {/* ── Quantity ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button type="button" onClick={() => setQty_(q => Math.max(1, q - 1))} disabled={qty <= 1}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40">−</button>
          <span className="px-4 py-2 font-semibold text-sm border-x min-w-[3rem] text-center">{qty}</span>
          <button type="button" onClick={() => setQty_(q => q + 1)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold">+</button>
        </div>
        <span className="text-xs text-gray-400">{UNIT_LABEL[unit].toLowerCase()}{qty > 1 ? 's' : ''}</span>
      </div>

      {/* ── Live breakdown ── */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {pallets > 0 && (
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pallets</p><p className="text-lg font-extrabold text-[#0B1F4D]">{num(pallets)}</p></div>
        )}
        {cartons > 0 && (
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Boxes</p><p className="text-lg font-extrabold text-[#0B1F4D]">{num(cartons)}</p></div>
        )}
        <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Units</p><p className="text-lg font-extrabold text-[#0B1F4D]">{num(pieces)}</p></div>
        <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total</p><p className="text-lg font-extrabold" style={{ color: UNIT_ACCENT[unit] }}>{fmt(lineTotal)}</p></div>
      </div>

      {/* ── Action ── */}
      <button type="button" onClick={addToCart} disabled={disabled}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all disabled:opacity-50 ${
          added ? 'bg-green-50 text-green-700 border-2 border-green-500' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]'
        }`}>
        {added ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to cart</>}
      </button>
      {canQuote && (
        <button type="button" onClick={requestQuote}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#ea580c] hover:underline">
          <FileText className="w-3.5 h-3.5" /> Or request a custom quote
        </button>
      )}
      {disabled && <p className="text-sm text-red-500 text-center">Out of stock</p>}
    </div>
  )
}
