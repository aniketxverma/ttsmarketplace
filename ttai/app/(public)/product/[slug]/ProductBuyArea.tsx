'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import {
  Package, Box, Layers, Truck, ShoppingCart, FileText, Check, Image as ImageIcon,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  availableUnits, piecesIn, cartonsIn, unitPrice, minUnitsFor,
  UNIT_LABEL, type PurchaseUnit, type PackagingProduct,
} from '@/lib/packaging'
import { WantToBuyButton } from '@/components/marketplace/WantToBuyButton'
import { ShareButton } from '@/components/product/ShareButton'

const UNIT_ICON: Record<PurchaseUnit, typeof Box> = { piece: Package, box: Box, pallet: Layers, truck: Truck }
const UNIT_ACCENT: Record<PurchaseUnit, string> = { piece: '#16a34a', box: '#0B1F4D', pallet: '#7c3aed', truck: '#ea580c' }
const UNIT_SUB: Record<PurchaseUnit, string> = {
  piece: 'Sold individually', box: 'By the carton', pallet: 'Businesses & distributors', truck: 'Full load · best price',
}

type ProductImage = { url: string; sort_order: number; image_role?: string | null }
type Product = PackagingProduct & { id: string; name: string; slug: string; currency_code: string }

export function ProductBuyArea({
  product, images, retail = false, shopUnits, negotiable = false, priceOnRequest = false, kgMode = false, wantToBuy = false, brand = null, whatsapp, supplierName, imageUrl,
  categoryName, supplierLabel, supplierHref, shipsFrom, supplierId, supplierMinCents = 0, topSlot, children,
}: {
  product: Product
  images: ProductImage[]
  retail?: boolean
  shopUnits?: PurchaseUnit[]
  negotiable?: boolean
  priceOnRequest?: boolean
  /** Outlet lots sold by weight — buy by the kilogram. */
  kgMode?: boolean
  /** B2B fast-stock — request to buy (supplier confirms) instead of immediate payment. */
  wantToBuy?: boolean
  brand?: string | null
  whatsapp?: string | null
  supplierName: string
  supplierId?: string
  supplierMinCents?: number
  imageUrl?: string
  categoryName?: string | null
  supplierLabel?: string | null
  supplierHref?: string | null
  shipsFrom?: string | null
  topSlot?: ReactNode
  children?: ReactNode
}) {
  const allUnits = availableUnits(product)
  const preferred = shopUnits ? allUnits.filter(u => shopUnits.includes(u)) : allUnits
  const units = preferred.length > 0 ? preferred : allUnits

  // Each tier carries its own minimum order quantity (number of that unit).
  const minFor = (u: PurchaseUnit) => minUnitsFor(product, u)

  const { addItem } = useCart()
  const router = useRouter()
  const [unit, setUnit] = useState<PurchaseUnit>(units[0] ?? 'piece')
  const [qty, setQty] = useState(() => minFor(units[0] ?? 'piece'))
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState(false)
  const minQ = minFor(unit)

  const fmt = (cents: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: product.currency_code }).format(cents / 100)
  const num = (n: number) => new Intl.NumberFormat('es-ES').format(n)

  // Gallery: retail photos for the piece, bulk photos for box/pallet/truck.
  // NULL-role images show in both; if a set is empty, fall back to all images.
  const wantRole = unit === 'piece' ? 'retail' : 'b2b'
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const roleImgs = sorted.filter(i => !i.image_role || i.image_role === wantRole)
  const gallery = roleImgs.length > 0 ? roleImgs : sorted
  const safeActive = Math.min(active, gallery.length - 1)
  const mainImg = gallery[safeActive]?.url

  // ── Gallery carousel: arrows + auto-advance (pauses on hover/interaction) ──
  const [paused, setPaused] = useState(false)
  const goPrev = () => setActive(i => (i - 1 + gallery.length) % gallery.length)
  const goNext = () => setActive(i => (i + 1) % gallery.length)
  useEffect(() => {
    if (gallery.length < 2 || paused) return
    const id = setInterval(() => setActive(i => (i + 1) % gallery.length), 4000)
    return () => clearInterval(id)
  }, [gallery.length, paused])

  function pickUnit(u: PurchaseUnit) { setUnit(u); setQty(minFor(u)); setActive(0) }

  const pieces  = piecesIn(product, unit) * qty
  const cartons = cartonsIn(product, unit) * qty
  const pallets = unit === 'truck' ? (product.pallets_per_truck ?? 0) * qty : unit === 'pallet' ? qty : 0
  const lineTotal = unitPrice(product, unit, retail) * qty
  const canQuote = unit === 'pallet' || unit === 'truck'

  function addToCart() {
    addItem({
      productId: product.id, unit, unitLabel: UNIT_LABEL[unit], name: product.name,
      price_cents: unitPrice(product, unit, retail),
      currency_code: product.currency_code, imageUrl, supplierName, retail,
      supplierId, supplierMinCents: supplierMinCents || undefined,
    }, qty)
    setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  // ── Buy by the kilogram (outlet weight lots) ──
  const minKg = Math.max(1, product.min_order_qty ?? 1)
  const [kg, setKg] = useState(minKg)
  const kgTotal = product.price_cents * kg
  function addToCartKg() {
    addItem({
      productId: product.id, unit: 'kg' as any, unitLabel: 'kg', name: product.name,
      price_cents: product.price_cents, currency_code: product.currency_code,
      imageUrl, supplierName, retail, supplierId, supplierMinCents: supplierMinCents || undefined,
    }, kg)
    setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  function requestQuote() {
    const msg = `Hi ${supplierName}, I'd like a quote for ${qty} ${UNIT_LABEL[unit].toLowerCase()}${qty > 1 ? 's' : ''} of "${product.name}" (${num(pieces)} units).`
    if (whatsapp) window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    else router.push('/marketplace')
  }
  function makeOffer() {
    const u = UNIT_LABEL[unit].toLowerCase()
    const msg = `Hi ${supplierName}, I'd like to negotiate the price for "${product.name}". For ${qty} ${u}${qty > 1 ? 's' : ''} my offer is ____ ${product.currency_code} / ${u}. Can we agree?`
    if (whatsapp) window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    else router.push('/marketplace')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-20 space-y-3">
        <div
          className="group relative aspect-square rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {mainImg ? (
            // key on the url so each slide fades in smoothly
            <Image key={mainImg} src={mainImg} alt={product.name} fill className="object-contain p-4 animate-[fadeIn_0.4s_ease]" sizes="(max-width:1024px) 100vw, 50vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-200"><ImageIcon className="w-16 h-16" /></div>
          )}
          {unit !== 'piece' && (
            <span className="absolute top-3 left-3 z-10 text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full text-white shadow"
              style={{ background: UNIT_ACCENT[unit] }}>
              {UNIT_LABEL[unit]} view
            </span>
          )}

          {gallery.length > 1 && (
            <>
              {/* Prev / Next arrows */}
              <button type="button" aria-label="Previous image" onClick={goPrev}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 transition-all opacity-60 group-hover:opacity-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" aria-label="Next image" onClick={goNext}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 transition-all opacity-60 group-hover:opacity-100">
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Counter + dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1">
                {gallery.map((_, i) => (
                  <button key={i} type="button" aria-label={`Go to image ${i + 1}`} onClick={() => setActive(i)}
                    className={`rounded-full transition-all ${i === safeActive ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="flex gap-2.5 flex-wrap">
            {gallery.map((img, i) => (
              <button key={img.url} type="button" onClick={() => setActive(i)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === safeActive ? 'border-[#0B1F4D] ring-2 ring-[#0B1F4D]/15 scale-105' : 'border-gray-100 hover:border-gray-300 opacity-80 hover:opacity-100'}`}>
                <Image src={img.url} alt="" fill className="object-contain p-1" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Buy panel ────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          {supplierHref && (
            <Link href={supplierHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-[#0B1F4D] transition-colors mb-1">
              {supplierLabel}
            </Link>
          )}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {categoryName && <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest">{categoryName}</p>}
            {brand && <span className="text-[11px] font-extrabold uppercase tracking-wide bg-[#0B1F4D]/5 text-[#0B1F4D] px-2 py-0.5 rounded">{brand}</span>}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight">{product.name}</h1>
            <div className="flex-shrink-0 pt-1"><ShareButton title={product.name} /></div>
          </div>
        </div>

        {topSlot}

        {/* Selected-unit price */}
        {priceOnRequest ? (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-black text-violet-700">Price on request</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-black text-[#0B1F4D]">{fmt(kgMode ? product.price_cents : unitPrice(product, unit, retail))}</span>
            <span className="text-sm text-gray-400 font-medium">/ {kgMode ? 'kg' : UNIT_LABEL[unit].toLowerCase()}</span>
          </div>
        )}
        <div>
          {priceOnRequest
            ? <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 px-2.5 py-1 text-[11px] font-extrabold">🙈 Contact for pricing — request a quote</span>
            : negotiable
            ? <span className="inline-flex items-center gap-1 rounded-full bg-[#F5A623]/15 text-[#a9690b] px-2.5 py-1 text-[11px] font-extrabold">💬 Negotiable price — make an offer</span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 px-2.5 py-1 text-[11px] font-bold">🔒 Fixed price · final</span>}
        </div>

        {supplierMinCents > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p><span className="font-bold">Minimum order {fmt(supplierMinCents)}</span> from this supplier — combine any products &amp; quantities to reach it.</p>
          </div>
        )}

        {kgMode ? (
          <>
            {/* Weight selector (buy by the kilogram) */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Weight:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button type="button" onClick={() => setKg(k => Math.max(minKg, k - 10))} disabled={kg <= minKg} className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40">−</button>
                <input type="number" value={kg} min={minKg} onChange={(e) => setKg(Math.max(minKg, parseInt(e.target.value) || minKg))} className="w-20 px-2 py-2 text-center font-semibold text-sm border-x outline-none" />
                <button type="button" onClick={() => setKg(k => k + 10)} className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold">+</button>
              </div>
              <span className="text-xs text-gray-400">kg</span>
              {minKg > 1 && <span className="text-xs font-semibold text-[#F5A623]">Min. {num(minKg)} kg</span>}
            </div>
            {!priceOnRequest && (
              <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">{num(kg)} kg × {fmt(product.price_cents)}</span>
                <span className="text-lg font-extrabold text-[#0B1F4D]">{fmt(kgTotal)}</span>
              </div>
            )}
            {wantToBuy && supplierId ? (
              <WantToBuyButton productId={product.id} productName={product.name} supplierId={supplierId} supplierName={supplierName} unit="kg" unitLabel="kg" quantity={kg} />
            ) : priceOnRequest && supplierId ? (
              <WantToBuyButton quote label="Request price / quote" productId={product.id} productName={product.name} supplierId={supplierId} supplierName={supplierName} unit="kg" unitLabel="kg" quantity={kg} />
            ) : priceOnRequest ? (
              <button type="button" onClick={requestQuote} className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all"><FileText className="w-4 h-4" /> Request price / quote</button>
            ) : (
              <button type="button" onClick={addToCartKg} className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${added ? 'bg-green-50 text-green-700 border-2 border-green-500' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e] hover:shadow-lg'}`}>{added ? <><Check className="w-4 h-4" /> Added to cart!</> : <><ShoppingCart className="w-4 h-4" /> Add to cart · {fmt(kgTotal)}</>}</button>
            )}
          </>
        ) : (
         <>
        {/* Unit option cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {units.map((u) => {
            const Icon = UNIT_ICON[u]; const on = u === unit
            return (
              <button key={u} type="button" onClick={() => pickUnit(u)}
                className={`relative rounded-2xl border p-3 text-left transition-all ${on ? 'border-transparent shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                style={on ? { boxShadow: `0 0 0 2px ${UNIT_ACCENT[u]}`, background: `${UNIT_ACCENT[u]}0a` } : undefined}>
                {on && <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: UNIT_ACCENT[u] }}><Check className="w-2.5 h-2.5 text-white" strokeWidth={4} /></span>}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${UNIT_ACCENT[u]}1a`, color: UNIT_ACCENT[u] }}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-extrabold text-[#0B1F4D]">{UNIT_LABEL[u]}</p>
                <p className="text-[11px] text-gray-400 leading-tight mb-1">{UNIT_SUB[u]}</p>
                {!priceOnRequest && <p className="text-xs font-bold" style={{ color: UNIT_ACCENT[u] }}>{fmt(unitPrice(product, u, retail))}</p>}
              </button>
            )
          })}
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button type="button" onClick={() => setQty(q => Math.max(minQ, q - 1))} disabled={qty <= minQ} className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40">−</button>
            <span className="px-4 py-2 font-semibold text-sm border-x min-w-[3rem] text-center">{qty}</span>
            <button type="button" onClick={() => setQty(q => q + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold">+</button>
          </div>
          <span className="text-xs text-gray-400">{UNIT_LABEL[unit].toLowerCase()}{qty > 1 ? 's' : ''}</span>
          {minQ > 1 && (
            <span className="text-xs font-semibold text-[#F5A623]">Min. order: {num(minQ)} {UNIT_LABEL[unit].toLowerCase()}s</span>
          )}
        </div>

        {/* Breakdown */}
        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {pallets > 0 && <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pallets</p><p className="text-lg font-extrabold text-[#0B1F4D]">{num(pallets)}</p></div>}
          {cartons > 0 && <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Boxes</p><p className="text-lg font-extrabold text-[#0B1F4D]">{num(cartons)}</p></div>}
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Units</p><p className="text-lg font-extrabold text-[#0B1F4D]">{num(pieces)}</p></div>
          {!priceOnRequest && <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total</p><p className="text-lg font-extrabold" style={{ color: UNIT_ACCENT[unit] }}>{fmt(lineTotal)}</p></div>}
        </div>

        {/* Action */}
        {wantToBuy && supplierId ? (
          <WantToBuyButton productId={product.id} productName={product.name} supplierId={supplierId} supplierName={supplierName} unit={unit} unitLabel={UNIT_LABEL[unit]} quantity={qty} />
        ) : priceOnRequest && supplierId ? (
          <WantToBuyButton quote label="Request price / quote" productId={product.id} productName={product.name} supplierId={supplierId} supplierName={supplierName} unit={unit} unitLabel={UNIT_LABEL[unit]} quantity={qty} />
        ) : priceOnRequest ? (
          <button type="button" onClick={requestQuote}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg transition-all">
            <FileText className="w-4 h-4" /> Request price / quote
          </button>
        ) : (
          <button type="button" onClick={addToCart}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${added ? 'bg-green-50 text-green-700 border-2 border-green-500' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e] hover:shadow-lg'}`}>
            {added ? <><Check className="w-4 h-4" /> Added to cart!</> : <><ShoppingCart className="w-4 h-4" /> Add to cart · {fmt(lineTotal)}</>}
          </button>
        )}
        {negotiable && (
          <button type="button" onClick={makeOffer}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#F5A623] text-[#a9690b] px-4 py-3 text-sm font-bold hover:bg-[#F5A623]/5 transition-colors">
            💬 Make an offer · negotiate price
          </button>
        )}
        {canQuote && (
          <button type="button" onClick={requestQuote} className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#ea580c] hover:underline">
            <FileText className="w-3.5 h-3.5" /> Or request a custom quote
          </button>
        )}
         </>
        )}

        {/* Dropship note */}
        {shipsFrom && (
          <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3">
            <Truck className="w-4 h-4 text-[#0B1F4D] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-bold text-[#0B1F4D]">Ships directly from {shipsFrom}</span> — fulfilled by the verified supplier and sent straight to you. No extra leg through Spain.
            </p>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
