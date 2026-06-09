'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, X } from 'lucide-react'
import { CONDITIONS } from '@/lib/conditions'

const EMPTY = { price: '', stock: '', sku: '', condition: CONDITIONS[0] as string, warehouse: '', warranty: '', imei: '' }

/** Lets a logged-in supplier attach their own offer to a product/master (photos,
 *  description, specs, EAN, brand, model, capacity, color are copied) — they only
 *  add price/stock/SKU. Pass `masterId` to add an offer to a master, or `productId`
 *  to copy an existing supplier's product. */
export function CopyProductButton({ productId, masterId, productName }: { productId?: string; masterId?: string; productName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  const isOffer = !!masterId
  const label = isOffer ? 'Add your offer' : 'Copy this product'

  async function copy() {
    setSaving(true)
    const body = masterId
      ? { action: 'import', masterId, price: parseFloat(form.price) || 0, stock: form.stock, sku: form.sku, condition: form.condition, warehouse: form.warehouse, warranty: form.warranty, imei: form.imei }
      : { action: 'copyProduct', productId, price: parseFloat(form.price) || 0, stock: form.stock, sku: form.sku, condition: form.condition, warehouse: form.warehouse, warranty: form.warranty, imei: form.imei }
    const res = await fetch('/api/supplier/master', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { alert(j.error ?? 'Failed'); return }
    if (j.productId) router.push(`/supplier/products/${j.productId}/edit`)
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm'

  return (
    <>
      <button
        onClick={() => { setForm({ ...EMPTY }); setOpen(true) }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#0B1F4D] bg-white text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#0B1F4D] hover:text-white transition-colors"
      >
        <Copy className="w-4 h-4" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-[#0B1F4D]">{isOffer ? 'Add your offer' : 'Copy to my catalogue'}</p>
                <p className="text-xs text-gray-400 line-clamp-1">{productName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-400">Photos, description, specs, EAN, brand &amp; model are copied automatically. Add your own:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Price (€) *</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Supplier SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Condition</label>
                <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputCls + ' bg-white'}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Warranty</label><input value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="e.g. 12 months" className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">IMEI <span className="text-gray-300 normal-case">(opt.)</span></label><input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Warehouse location</label><input value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} placeholder="e.g. Madrid · Aisle 4" className={inputCls} /></div>
            </div>
            <button onClick={copy} disabled={saving} className="w-full rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (isOffer ? 'Add my offer' : 'Copy to my catalogue')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
