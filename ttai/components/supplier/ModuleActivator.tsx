'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import Link from 'next/link'
import { Check, Loader2, ArrowRight, Lock, Tag } from 'lucide-react'
import { MODULE_CATALOG } from '@/lib/outlet'

/** Supplier self-activates TTAIEMA modules.
 *  Directional rule: a Marketplace seller can connect into the Outlet Zone in one
 *  click; an Outlet-only seller must REQUEST Marketplace access (verification),
 *  which opens a Control Center ticket for our team to review. */
export function ModuleActivator({ initial, companyName, email }: { initial: string[]; companyName: string; email: string }) {
  const t = useT()
  const [modules, setModules] = useState<string[]>(initial?.length ? initial : ['marketplace', 'outlet'])
  const [busy, setBusy] = useState<string | null>(null)
  const [requested, setRequested] = useState<Set<string>>(new Set())

  const hasMarketplace = modules.includes('marketplace')

  async function toggle(key: string, active: boolean) {
    setBusy(key)
    const res = await fetch('/api/supplier/modules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: key, active }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (res.ok && data.modules) setModules(data.modules)
    else if (data.requiresVerification) requestAccess(key)
    else alert(data.error || 'Could not update module')
  }

  // Outlet-only seller asking to join the Marketplace → Control Center ticket.
  async function requestAccess(key: string) {
    setBusy(key)
    try {
      await fetch('/api/ticket', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: 'marketplace', companyName, clientName: companyName, email,
          subject: 'Marketplace access request (from Outlet)', sourceForm: 'module-marketplace-request',
          message: `${companyName} sells in the Outlet Zone and would like to be verified to also sell NEW products in the TTAI Marketplace. Please review and enable the marketplace module.`,
        }),
      })
    } catch { /* ignore */ }
    setRequested((s) => new Set(s).add(key))
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      {/* Directional rule explainer */}
      <div className="rounded-xl border border-[#0B1F4D]/10 bg-[#0B1F4D]/[0.03] px-4 py-3 text-[12.5px] text-gray-600 leading-snug">
        <span className="font-bold text-[#0B1F4D]">{t("One company, many channels.")}</span> {t("Marketplace sellers can")} <strong>{t("connect to the Outlet Zone instantly")}</strong> to clear stock &amp; full-pack lots. Outlet sellers need a quick <strong>{t("verification")}</strong> {t("to also sell new products in the Marketplace.")}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {MODULE_CATALOG.map((m) => {
          const on = modules.includes(m.key)
          // Marketplace is gated for outlet-only sellers (request, don't self-activate).
          const gated = m.key === 'marketplace' && !on && !hasMarketplace
          const wasRequested = requested.has(m.key)
          const isConnectOutlet = m.key === 'outlet' && !on
          return (
            <div key={m.key} className={`rounded-2xl border p-5 transition-all ${on ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : gated ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{m.emoji}</span>
                {on
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold px-2 py-0.5"><Check className="w-3 h-3" /> {t("Active")}</span>
                  : gated
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5"><Lock className="w-3 h-3" /> {t("Verification")}</span>
                  : <span className="rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold px-2 py-0.5">{t("Not active")}</span>}
              </div>
              <p className="font-extrabold text-[#0B1F4D] mt-2">{m.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
              <div className="flex items-center gap-3 mt-3">
                {on ? (
                  <>
                    <Link href={m.href} className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F4D] hover:underline">{t("Open")} <ArrowRight className="w-3 h-3" /></Link>
                    {m.key !== 'outlet' && m.key !== 'marketplace' && (
                      <button onClick={() => toggle(m.key, false)} disabled={busy === m.key} className="text-xs text-gray-400 hover:text-red-500">{busy === m.key ? '…' : 'Deactivate'}</button>
                    )}
                  </>
                ) : gated ? (
                  wasRequested ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 text-green-700 px-4 py-2 text-xs font-bold"><Check className="w-3.5 h-3.5" /> {t("Access requested")}</span>
                  ) : (
                    <button onClick={() => requestAccess(m.key)} disabled={busy === m.key}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1F4D] text-[#0B1F4D] px-4 py-2 text-xs font-bold hover:bg-[#0B1F4D]/5 transition-colors disabled:opacity-60">
                      {busy === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} {t("Request access")}
                    </button>
                  )
                ) : (
                  <button onClick={() => toggle(m.key, true)} disabled={busy === m.key}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${isConnectOutlet ? 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]' : 'bg-[#F5A623] text-[#0B1F4D] hover:bg-[#fbb93a]'}`}>
                    {busy === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isConnectOutlet ? <Tag className="w-3.5 h-3.5" /> : null}
                    {isConnectOutlet ? 'Connect to Outlet Zone' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
