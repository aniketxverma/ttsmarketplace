'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PricingConfig } from '@/lib/pricing-rules'
import { minRetailCents, addVatCents } from '@/lib/pricing-rules'

export function PricingManager({ initial }: { initial: PricingConfig }) {
  const router = useRouter()
  const [minMarginPct, setMargin] = useState(String(initial.minMarginPct))
  const [vatPct, setVat] = useState(String(initial.vatPct))
  const [vatEnabled, setVatEnabled] = useState(initial.vatEnabled)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const margin = parseFloat(minMarginPct) || 0
  const vat = parseFloat(vatPct) || 0
  // Live preview on a €2.00 wholesale example.
  const example = 200
  const floor = minRetailCents(example, margin)
  const withTax = vatEnabled ? addVatCents(floor, vat) : floor
  const fmt = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100)

  async function save() {
    setSaving(true); setSaved(false)
    const res = await fetch('/api/admin/pricing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minMarginPct: margin, vatPct: vat, vatEnabled }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2500) }
    else alert((await res.json().catch(() => ({})))?.error ?? 'Save failed')
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]'
  const labelCls = 'text-xs font-bold text-gray-500 uppercase tracking-wide'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-5">
        {/* Minimum margin */}
        <div className="space-y-1.5">
          <label className={labelCls}>Minimum retail margin (%)</label>
          <input type="number" min="0" step="1" value={minMarginPct} onChange={(e) => setMargin(e.target.value)} className={inputCls} />
          <p className="text-xs text-gray-400">Suppliers&apos; end-user price must be at least wholesale + this margin. Default 30%.</p>
        </div>

        {/* VAT */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[#0B1F4D]">National sales VAT</p>
            <p className="text-xs text-gray-400">Apply VAT to retail prices shown to end users.</p>
          </div>
          <button type="button" onClick={() => setVatEnabled((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${vatEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${vatEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>VAT rate (%)</label>
          <input type="number" min="0" step="0.5" value={vatPct} onChange={(e) => setVat(e.target.value)} disabled={!vatEnabled}
            className={`${inputCls} ${!vatEnabled ? 'bg-gray-50 text-gray-400' : ''}`} />
          <p className="text-xs text-gray-400">Default 21% (Spain). Products can still override their own VAT rate.</p>
        </div>

        {/* Live example */}
        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
          <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Example · €2.00 wholesale</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-gray-500">Min. retail: <span className="font-extrabold text-[#0B1F4D]">{fmt(floor)}</span> <span className="text-gray-400">(+{margin}%)</span></span>
            {vatEnabled && <span className="text-gray-500">With VAT: <span className="font-extrabold text-[#0B1F4D]">{fmt(withTax)}</span> <span className="text-gray-400">(+{vat}%)</span></span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving}
            className="rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-60">
            {saving ? 'Saving…' : 'Save pricing rules'}
          </button>
          {saved && <span className="text-sm font-bold text-green-600">Saved ✓</span>}
        </div>
      </div>
    </div>
  )
}
