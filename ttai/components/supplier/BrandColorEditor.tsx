'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Sparkles, Check, Loader2 } from 'lucide-react'

const PRESETS = ['#0B1F4D', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#16a34a', '#0891b2', '#111827']

/** Premium: pick the brand accent colour applied to the public storefront. */
export function BrandColorEditor({ initial }: { initial: string | null }) {
  const t = useT()
  const [color, setColor] = useState(initial || '#0B1F4D')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true); setSaved(false)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_color: color }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else alert('Could not save brand color')
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[#F5A623]" />
        <h3 className="font-extrabold text-[#0B1F4D]">{t("Brand Color")}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{t("Included")}</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">{t("Your accent colour — applied to your storefront header and primary buttons.")}</p>

      <div className="flex flex-wrap items-center gap-2.5">
        {PRESETS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={c}
            className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${color.toLowerCase() === c.toLowerCase() ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-300' : 'border-white shadow'}`}
            style={{ backgroundColor: c }} />
        ))}
        <label className="flex items-center gap-2 ml-2 text-sm text-gray-500">
          {t("Custom")}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer bg-white p-0.5" />
        </label>
      </div>

      {/* Preview */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: color }} />
        <button className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: color }}>{t("Follow Shop")}</button>
        <span className="text-xs text-gray-400 font-mono">{color}</span>
      </div>

      <button onClick={save} disabled={saving}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] hover:bg-[#16306b] text-white px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("Saving…")}</> : saved ? <><Check className="w-4 h-4" /> {t("Saved")}</> : 'Save brand color'}
      </button>
    </div>
  )
}
