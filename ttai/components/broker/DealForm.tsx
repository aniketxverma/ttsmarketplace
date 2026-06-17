'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle2, Lock } from 'lucide-react'

/** Submit a broker deal — optional TTAIEMA invoicing. Locked until the broker has
 *  at least one supplier + one buyer reference (mandatory rule). */
export function DealForm({ canPost }: { canPost: boolean }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSending(true); setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/broker/deal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierRef: f.get('supplierRef'), buyerRef: f.get('buyerRef'), product: f.get('product'),
          quantity: f.get('quantity'), price: f.get('price'), currencyCode: f.get('currencyCode'),
          commissionPct: f.get('commissionPct'), needsInvoicing: f.get('needsInvoicing') === 'on', notes: f.get('notes'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'failed')
      setDone(true); router.refresh()
    } catch (err: any) { setError(err.message === 'failed' ? 'Something went wrong.' : err.message) }
    finally { setSending(false) }
  }

  if (!canPost) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Lock className="w-8 h-8 text-amber-600 mx-auto" />
        <p className="font-bold text-amber-900 mt-2">Deals are locked</p>
        <p className="text-sm text-amber-800 mt-1">Register at least one <strong>Supplier</strong> and one <strong>Buyer</strong> reference first.</p>
        <a href="/broker/network" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold mt-3 hover:bg-[#162d6e]">Go to My Network</a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <p className="mt-2 font-extrabold text-[#0B1F4D]">Deal submitted</p>
        <p className="text-sm text-gray-500 mt-1">It’s in your commission history. If you asked for invoicing, our team will follow up.</p>
        <button onClick={() => setDone(false)} className="mt-3 text-sm font-bold text-[#0B1F4D] underline">Submit another</button>
      </div>
    )
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] focus:ring-1 focus:ring-[#0B1F4D] outline-none'
  const lbl = 'text-xs font-bold text-gray-600'

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-extrabold text-[#0B1F4D]">Submit a deal</h3>
      <p className="text-sm text-gray-500 mt-0.5">For commission tracking — tick the box to have TTAIEMA invoice on your behalf.</p>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <label className="block"><span className={lbl}>Supplier reference *</span><input name="supplierRef" required className={input} placeholder="Supplier name or Broker ref" /></label>
        <label className="block"><span className={lbl}>Buyer reference *</span><input name="buyerRef" required className={input} placeholder="Buyer / client name" /></label>
        <label className="block sm:col-span-2"><span className={lbl}>Product *</span><input name="product" required className={input} placeholder="e.g. 2 pallets mixed electronics returns" /></label>
        <label className="block"><span className={lbl}>Quantity</span><input name="quantity" className={input} placeholder="e.g. 2 pallets" /></label>
        <label className="block"><span className={lbl}>Price</span>
          <div className="flex gap-2">
            <select name="currencyCode" className="rounded-xl border border-gray-200 px-2 text-sm bg-white">{['EUR', 'USD', 'GBP'].map((c) => <option key={c}>{c}</option>)}</select>
            <input name="price" type="number" step="0.01" min="0" className={input} placeholder="0.00" />
          </div></label>
        <label className="block"><span className={lbl}>Agreed commission %</span><input name="commissionPct" type="number" step="0.1" min="0" max="100" className={input} placeholder="e.g. 5" /></label>
        <label className="block sm:col-span-2"><span className={lbl}>Notes</span><textarea name="notes" rows={2} className={input} /></label>
        <label className="sm:col-span-2 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer">
          <input name="needsInvoicing" type="checkbox" className="mt-0.5 w-4 h-4 accent-[#0B1F4D]" />
          <span className="text-xs text-gray-600"><span className="font-bold text-[#0B1F4D]">Use TTAIEMA invoicing service</span><br />I don’t want to invoice directly — TTAIEMA issues the invoice and handles the commission per platform rules.</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <button type="submit" disabled={sending}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60">
        <Send className="w-4 h-4" /> {sending ? 'Submitting…' : 'Submit deal'}
      </button>
    </form>
  )
}
