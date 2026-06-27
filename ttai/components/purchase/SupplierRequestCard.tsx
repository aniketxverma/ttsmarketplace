'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Check, X, MessageCircle, Mail } from 'lucide-react'

const STATUS: Record<string, string> = {
  requested: 'bg-blue-100 text-blue-700', confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-rose-100 text-rose-700', paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-600',
}
const money = (c?: number | null, cur = 'EUR') => c == null ? '—' : new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur }).format(c / 100)

export function SupplierRequestCard({ r }: { r: any }) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ confirmedQty: r.quantity ?? '', price: '', currency: r.currency_code ?? 'EUR', deliveryTime: '', note: '' })
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const wa = r.buyer_phone ? `https://wa.me/${String(r.buyer_phone).replace(/\D/g, '')}` : null

  async function act(action: 'confirm' | 'decline') {
    setBusy(true)
    await fetch(`/api/purchase-request/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'confirm' ? { action, ...form } : { action, note: form.note }),
    })
    setBusy(false); router.refresh()
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{r.product_name ?? 'Product'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{[r.buyer_company, r.buyer_name, r.buyer_email].filter(Boolean).join(' · ')}</p>
        </div>
        <span className={`rounded-full text-[10px] font-extrabold px-2 py-0.5 ${STATUS[r.status] ?? 'bg-gray-100'}`}>{r.status}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-gray-500">
        <span>{t("Wants:")} <strong className="text-gray-700">{r.quantity ?? '—'}</strong></span>
        <span className="text-gray-300">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      </div>
      {r.message && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{r.message}</p>}

      {r.status === 'confirmed' && (
        <div className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          {t("Confirmed:")} <strong>{r.confirmed_qty}</strong> · {money(r.confirmed_price_cents, r.currency_code)} · {r.delivery_time || 'delivery TBC'}{r.supplier_note ? ` — ${r.supplier_note}` : ''}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {r.buyer_email && <a href={`mailto:${r.buyer_email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"><Mail className="w-3.5 h-3.5" /> {t("Email")}</a>}
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 text-green-600 px-3 py-1.5 text-xs font-bold hover:bg-green-50"><MessageCircle className="w-3.5 h-3.5" /> {t("WhatsApp")}</a>}
        {r.status === 'requested' && (
          <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#162d6e]"><Check className="w-3.5 h-3.5" /> {t("Confirm")}</button>
        )}
        {r.status === 'requested' && (
          <button onClick={() => act('decline')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 text-rose-600 px-3.5 py-1.5 text-xs font-bold hover:bg-rose-50"><X className="w-3.5 h-3.5" /> {t("Decline")}</button>
        )}
      </div>

      {open && r.status === 'requested' && (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 grid sm:grid-cols-2 gap-2.5">
          <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Confirmed quantity")}</span><input className={inp} value={form.confirmedQty} onChange={(e) => set('confirmedQty', e.target.value)} /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Final price")}</span>
            <div className="flex gap-1.5">
              <select className="rounded-lg border border-gray-200 px-1.5 text-xs bg-white" value={form.currency} onChange={(e) => set('currency', e.target.value)}>{['EUR', 'USD', 'GBP'].map((c) => <option key={c}>{c}</option>)}</select>
              <input className={inp} type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder={t("total")} />
            </div></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Delivery time")}</span><input className={inp} value={form.deliveryTime} onChange={(e) => set('deliveryTime', e.target.value)} placeholder={t("e.g. 5–7 days")} /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-500">{t("Note")}</span><input className={inp} value={form.note} onChange={(e) => set('note', e.target.value)} /></label>
          <button onClick={() => act('confirm')} disabled={busy} className="sm:col-span-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-bold hover:bg-green-700 disabled:opacity-60">{busy ? 'Confirming…' : 'Confirm stock & price → buyer can pay'}</button>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm bg-white focus:border-[#0B1F4D] outline-none'
