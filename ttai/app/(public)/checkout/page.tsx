'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<'card' | 'bank_transfer' | 'cod'>('card')

  const [form, setForm] = useState({
    fullName: '', line1: '', city: '', postalCode: '', country: 'ES', phone: '', vatNumber: '',
  })

  // Display estimate only — the authoritative VAT (incl. EU reverse charge) is
  // computed server-side from your tax status and shown on the invoice.
  const vatCents = Math.round(totalCents * 0.21)
  const grandTotal = totalCents + vatCents
  const currency = items[0]?.currency_code ?? 'EUR'

  // Per-supplier minimum order value — buyer can combine products to reach it.
  const supGroups = new Map<string, { name: string; min: number; subtotal: number; currency: string }>()
  for (const it of items) {
    const sid = it.supplierId ?? `name:${it.supplierName}`
    const g = supGroups.get(sid) ?? { name: it.supplierName, min: 0, subtotal: 0, currency: it.currency_code }
    g.subtotal += it.price_cents * it.quantity
    if (it.supplierMinCents) g.min = it.supplierMinCents
    supGroups.set(sid, g)
  }
  const unmetMin = Array.from(supGroups.values()).filter((g) => g.min > 0 && g.subtotal < g.min)
  const minBlocked = unmetMin.length > 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/orders/simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unit: i.unit })),
        shippingAddress: { fullName: form.fullName, line1: form.line1, city: form.city, postalCode: form.postalCode, country: form.country, phone: form.phone },
        vatNumber: form.vatNumber || undefined,
        paymentMethod: payMethod,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to place order. Please try again.')
      setLoading(false)
      return
    }

    // Card → redirect to Stripe Checkout. Bank transfer / COD → confirmation page.
    if (data.checkoutUrl) {
      clearCart()
      window.location.href = data.checkoutUrl
      return
    }
    clearCart()
    router.push(`/checkout/success?id=${data.primaryOrderId}&m=${payMethod}`)
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0B1F4D] mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products before checking out.</p>
        <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-8 py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors">
          Browse Marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/marketplace" className="hover:text-gray-600 transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Checkout</span>
        </div>

        <h1 className="text-2xl font-extrabold text-[#0B1F4D] mb-8">Complete Your Order</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Left: Shipping Form ──────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Shipping Address Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-[#0B1F4D] text-base mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0B1F4D] text-white text-xs font-black flex items-center justify-center">1</div>
                  Shipping Details
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Name *</label>
                      <input
                        name="fullName" value={form.fullName} onChange={handleChange} required
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Address *</label>
                      <input
                        name="line1" value={form.line1} onChange={handleChange} required
                        placeholder="123 Main Street, Floor 2"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">City *</label>
                      <input
                        name="city" value={form.city} onChange={handleChange} required
                        placeholder="Madrid"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Postal Code *</label>
                      <input
                        name="postalCode" value={form.postalCode} onChange={handleChange} required
                        placeholder="28001"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Country *</label>
                      <select
                        name="country" value={form.country} onChange={handleChange} required
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all bg-white"
                      >
                        {[
                          ['ES','Spain'], ['DE','Germany'], ['FR','France'], ['IT','Italy'],
                          ['GB','United Kingdom'], ['NL','Netherlands'], ['US','United States'],
                          ['AE','UAE'], ['SA','Saudi Arabia'], ['MA','Morocco'],
                        ].map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone</label>
                      <input
                        name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+34 600 000 000"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">VAT number <span className="text-gray-400 normal-case font-normal">(businesses — EU reverse charge)</span></label>
                      <input
                        name="vatNumber" value={form.vatNumber} onChange={handleChange}
                        placeholder="e.g. DE123456789"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-gray-400">EU businesses with a valid VAT number in another country may be billed without VAT (intra-community).</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment note */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-[#0B1F4D] text-base mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0B1F4D] text-white text-xs font-black flex items-center justify-center">2</div>
                  Payment
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {([
                    { v: 'card', label: 'Card', sub: 'Visa · Mastercard', icon: 'M3 10h18M7 15h2m-5 4h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z' },
                    { v: 'bank_transfer', label: 'Bank transfer', sub: 'Invoice · pay later', icon: 'M3 21h18M4 10h16M5 10V7l7-4 7 4v3M6 10v8m4-8v8m4-8v8m4-8v8' },
                    { v: 'cod', label: 'Cash on delivery', sub: 'Pay on arrival', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  ] as const).map((m) => (
                    <button key={m.v} type="button" onClick={() => setPayMethod(m.v)}
                      className={`text-left rounded-xl border p-3 transition-all ${payMethod === m.v ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.04] ring-1 ring-[#0B1F4D]' : 'border-gray-200 hover:border-gray-300'}`}>
                      <svg className={`w-5 h-5 mb-1 ${payMethod === m.v ? 'text-[#0B1F4D]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={m.icon} /></svg>
                      <p className="font-bold text-[#0B1F4D] text-sm leading-tight">{m.label}</p>
                      <p className="text-[11px] text-gray-400">{m.sub}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-blue-50/60 border border-blue-100 rounded-xl px-3.5 py-2.5">
                  <svg className="w-4 h-4 mt-0.5 text-[#0B1F4D] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {payMethod === 'card' && <span><span className="font-semibold text-[#0B1F4D]">Secure card payment.</span> You&apos;ll be redirected to Stripe to pay. Your order is confirmed instantly on payment.</span>}
                  {payMethod === 'bank_transfer' && <span><span className="font-semibold text-[#0B1F4D]">Bank transfer.</span> We&apos;ll create your order &amp; invoice with the bank details — pay within 24–48h to confirm.</span>}
                  {payMethod === 'cod' && <span><span className="font-semibold text-[#0B1F4D]">Cash on delivery.</span> Pay the supplier when your order arrives (subject to supplier approval).</span>}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* ── Right: Order Summary ─────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-20">
                <div className="p-5 border-b">
                  <h2 className="font-bold text-[#0B1F4D]">Order Summary</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{items.length} product{items.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Items */}
                <div className="p-5 space-y-4 max-h-72 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.quantity} {item.unit !== 'piece' ? `${item.unitLabel ?? item.unit}${item.quantity > 1 ? 's' : ''}` : `unit${item.quantity > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#0B1F4D] flex-shrink-0">
                        {fmt(item.price_cents * item.quantity, item.currency_code)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="p-5 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{fmt(totalCents, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VAT (est.)</span>
                    <span className="font-medium">{fmt(vatCents, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="pt-3 border-t flex justify-between">
                    <span className="font-bold text-[#0B1F4D]">Total</span>
                    <span className="font-extrabold text-[#0B1F4D] text-lg">{fmt(grandTotal, currency)}</span>
                  </div>
                </div>

                {/* Minimum-order-value warnings */}
                {unmetMin.length > 0 && (
                  <div className="px-5 pb-1 space-y-2">
                    {unmetMin.map((g, i) => (
                      <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                        <span className="font-bold">{g.name}</span> requires a minimum order of {fmt(g.min, g.currency)}.
                        Add <span className="font-bold">{fmt(g.min - g.subtotal, g.currency)}</span> more from this supplier to checkout.
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="p-5 pt-2">
                  <button
                    type="submit"
                    disabled={loading || minBlocked}
                    className="w-full rounded-xl bg-[#F5A623] text-[#0B1F4D] py-4 text-sm font-extrabold hover:bg-[#fbb93a] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {payMethod === 'card' ? 'Redirecting to payment…' : 'Placing Order...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {payMethod === 'card' ? 'Pay' : 'Place Order'} · {fmt(grandTotal, currency)}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    By placing your order you agree to our terms of service
                  </p>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
