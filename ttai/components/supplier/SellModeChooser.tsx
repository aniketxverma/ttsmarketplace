'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Check, Loader2 } from 'lucide-react'
import { SELL_MODES } from '@/lib/outlet'

/** Lets an Outlet supplier choose how buyers can transact with their lots.
 *  Saves suppliers.outlet_sell_mode via /api/supplier/brand. */
export function SellModeChooser({ initial }: { initial: string | null }) {
  const t = useT()
  const [value, setValue] = useState<string | null>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function choose(v: string) {
    setValue(v); setSaved(false); setSaving(true)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outlet_sell_mode: v }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else alert('Could not save sell mode')
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 max-w-2xl">
      <div>
        <h2 className="font-semibold">{t("How you sell in the Outlet Zone")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("Controls the buttons buyers see on your lots.")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SELL_MODES.map((m) => {
          const active = value === m.key
          return (
            <button key={m.key} onClick={() => choose(m.key)} disabled={saving}
              className={`text-left rounded-xl border-2 p-3 transition-all ${active ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#0B1F4D] text-sm">{m.label}</p>
                {active && <Check className="w-4 h-4 text-[#0B1F4D]" />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{m.desc}</p>
            </button>
          )
        })}
      </div>
      <div className="h-5 text-sm">
        {saving ? <span className="text-gray-400 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> {t("Saving…")}</span>
          : saved ? <span className="text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t("Saved")}</span> : null}
      </div>
    </div>
  )
}
