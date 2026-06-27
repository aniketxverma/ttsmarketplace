'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Check, Loader2, Building2, Store, Boxes, Handshake, ShoppingCart, X } from 'lucide-react'
import { OUTLET_ROLES, type RoleKey } from '@/lib/outlet'

const ICON: Record<RoleKey, any> = {
  direct_supplier: Building2, retail_chain: Store, distributor: Boxes, broker: Handshake, outlet_shop: ShoppingCart,
}

/**
 * Lets a supplier declare their role in the Outlet Zone (Direct Supplier, Retail
 * Chain, Distributor, Broker, Outlet Shop). Saves suppliers.outlet_role via
 * /api/supplier/brand. Used as the "Supplier Type" filter in /outlet.
 */
export function OutletRoleChooser({ initial }: { initial: string | null }) {
  const t = useT()
  const [value, setValue] = useState<string | null>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function choose(v: string | null) {
    setValue(v); setSaved(false); setSaving(true)
    const res = await fetch('/api/supplier/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outlet_role: v ?? '' }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else alert('Could not save outlet role')
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold">{t("Outlet Zone role")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("How you trade in the")} <a href="/outlet" target="_blank" className="text-[#0B1F4D] font-semibold underline">{t("Outlet Zone")}</a>. Buyers filter sellers by this. Optional — set it if you list clearance, returns or liquidation stock.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {OUTLET_ROLES.map((r) => {
          const Icon = ICON[r.key]
          const active = value === r.key
          return (
            <button key={r.key} onClick={() => choose(r.key)} disabled={saving}
              className={`text-left rounded-xl border-2 p-3.5 transition-all ${active ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-4.5 h-4.5" /></span>
                {active && <Check className="w-4 h-4 text-[#0B1F4D]" />}
              </div>
              <p className="font-bold text-[#0B1F4D] text-sm mt-2.5">{r.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{r.blurb}</p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between h-5 text-sm">
        <span>
          {saving ? <span className="text-gray-400 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> {t("Saving…")}</span>
            : saved ? <span className="text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t("Saved")}</span> : null}
        </span>
        {value && !saving && (
          <button onClick={() => choose(null)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {t("Clear")}</button>
        )}
      </div>
    </div>
  )
}
