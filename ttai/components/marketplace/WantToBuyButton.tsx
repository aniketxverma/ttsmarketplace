'use client'

import { useState } from 'react'
import { X, Send, CheckCircle2, ShoppingBag, FileText } from 'lucide-react'
import { useAuthGate } from '@/components/shared/AuthGate'

/**
 * B2B "Want to Buy" — the buyer requests a purchase (no payment yet). The supplier
 * confirms stock, quantity, final price and delivery; only then the buyer pays.
 */
export function WantToBuyButton({ productId, productName, supplierId, supplierName, unit, unitLabel, quantity, label, quote }: {
  productId: string; productName: string; supplierId: string; supplierName: string
  unit: string; unitLabel: string; quantity: number | string
  /** Override the button text (e.g. "Request price / quote" for price-on-request lots). */
  label?: string
  /** Styles the button as a quote/price request (violet) rather than a purchase (navy). */
  quote?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { gate, modal } = useAuthGate({ title: 'Sign in to request a price', subtitle: 'Create a free account — your request and the supplier’s reply land in your dashboard.' })
  return (
    <>
      <button type="button" onClick={() => gate(() => setOpen(true))}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold hover:shadow-lg transition-all ${quote ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]'}`}>
        {quote ? <FileText className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />} {label ?? 'Want to Buy — request purchase'}
      </button>
      {modal}
      {open && <RequestModal {...{ productId, productName, supplierId, supplierName, unit, unitLabel, quantity }} onClose={() => setOpen(false)} />}
    </>
  )
}

function RequestModal({ productId, productName, supplierId, supplierName, unit, unitLabel, quantity, onClose }: any) {
  const [form, setForm] = useState({ quantity: String(quantity), company: '', phone: '', message: '' })
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setState('sending'); setError(null)
    try {
      const res = await fetch('/api/purchase-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId, productId, productName, unit,
          quantity: `${form.quantity} ${unitLabel.toLowerCase()}${Number(form.quantity) > 1 ? 's' : ''}`,
          buyerCompany: form.company, buyerPhone: form.phone, message: form.message,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'failed') }
      setState('done')
    } catch (e: any) { setError(e.message === 'failed' ? 'Something went wrong.' : e.message); setState('idle') }
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        {state === 'done' ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-extrabold text-[#0B1F4D] mt-3">Request sent to {supplierName}</h3>
            <p className="text-sm text-gray-500 mt-1">The supplier will reply with stock, final price &amp; delivery. Their answer appears in your dashboard → <span className="font-semibold text-[#0B1F4D]">My Purchase Requests</span>. You only pay after confirmation.</p>
            <a href="/buyer/requests" className="mt-4 inline-block rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold">View in dashboard</a>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-extrabold text-[#0B1F4D]">Request to buy</h3>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{productName} · {supplierName}</p>
            <div className="space-y-2.5 mt-4">
              <label className="block"><span className="text-xs font-bold text-gray-600">Quantity ({unitLabel.toLowerCase()}s)</span>
                <input className={input} type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} /></label>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="block"><span className="text-xs font-bold text-gray-600">Company</span><input className={input} value={form.company} onChange={(e) => set('company', e.target.value)} /></label>
                <label className="block"><span className="text-xs font-bold text-gray-600">Phone / WhatsApp</span><input className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label>
              </div>
              <label className="block"><span className="text-xs font-bold text-gray-600">Message (optional)</span>
                <textarea className={input} rows={2} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Target price, delivery destination, timeline…" /></label>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">No payment now — the supplier confirms availability &amp; price first.</p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <button onClick={submit} disabled={state === 'sending'}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-60">
              <Send className="w-4 h-4" /> {state === 'sending' ? 'Sending…' : 'Send purchase request'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
