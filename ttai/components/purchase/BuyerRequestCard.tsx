'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Check, X, CreditCard } from 'lucide-react'

const STATUS: Record<string, string> = {
  requested: 'bg-blue-100 text-blue-700', confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-rose-100 text-rose-700', paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-600',
}
const money = (c?: number | null, cur = 'EUR') => c == null ? '—' : new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur }).format(c / 100)

export function BuyerRequestCard({ r }: { r: any }) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function act(action: 'cancel' | 'pay') {
    setBusy(true)
    await fetch(`/api/purchase-request/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    setBusy(false); router.refresh()
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{r.product_name ?? 'Product'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t("Requested:")} {r.quantity ?? '—'} · {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
        </div>
        <span className={`rounded-full text-[10px] font-extrabold px-2 py-0.5 ${STATUS[r.status] ?? 'bg-gray-100'}`}>{r.status}</span>
      </div>

      {r.status === 'requested' && <p className="text-sm text-gray-500 mt-2">Waiting for the supplier to confirm stock, price &amp; delivery. You&rsquo;ll be able to pay once confirmed.</p>}

      {r.status === 'confirmed' && (
        <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
          <p className="font-bold text-green-800">{t("Confirmed by supplier ✓")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-green-700 text-[13px]">
            <span>{t("Qty:")} <strong>{r.confirmed_qty}</strong></span>
            <span>{t("Price:")} <strong>{money(r.confirmed_price_cents, r.currency_code)}</strong></span>
            <span>{t("Delivery:")} <strong>{r.delivery_time || 'TBC'}</strong></span>
          </div>
          {r.supplier_note && <p className="text-xs text-green-700 mt-1">{r.supplier_note}</p>}
        </div>
      )}
      {r.status === 'declined' && <p className="text-sm text-rose-600 mt-2">{t("The supplier declined this request")}{r.supplier_note ? `: ${r.supplier_note}` : '.'}</p>}

      <div className="flex flex-wrap gap-2 mt-3">
        {r.status === 'confirmed' && (
          <button onClick={() => act('pay')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-4 py-2 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-60"><CreditCard className="w-4 h-4" /> {busy ? '…' : 'Accept & proceed to pay'}</button>
        )}
        {(r.status === 'requested' || r.status === 'confirmed') && (
          <button onClick={() => act('cancel')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 text-gray-500 px-3.5 py-2 text-sm font-bold hover:bg-gray-50"><X className="w-4 h-4" /> {t("Cancel")}</button>
        )}
        {r.status === 'paid' && <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700"><Check className="w-4 h-4" /> {t("Payment confirmed — the supplier will arrange delivery.")}</span>}
      </div>
    </div>
  )
}
