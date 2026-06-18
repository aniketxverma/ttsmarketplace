'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, ArrowRight } from 'lucide-react'
import { MODULE_CATALOG } from '@/lib/outlet'

/** Supplier self-activates TTAIEMA modules — expand from Outlet into Marketplace,
 *  Trade Hub, Logistics or Consulting without a new company profile. */
export function ModuleActivator({ initial }: { initial: string[] }) {
  const [modules, setModules] = useState<string[]>(initial?.length ? initial : ['marketplace', 'outlet'])
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(key: string, active: boolean) {
    setBusy(key)
    const res = await fetch('/api/supplier/modules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: key, active }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (res.ok && data.modules) setModules(data.modules)
    else alert(data.error || 'Could not update module')
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {MODULE_CATALOG.map((m) => {
        const on = modules.includes(m.key)
        return (
          <div key={m.key} className={`rounded-2xl border p-5 transition-all ${on ? 'border-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl">{m.emoji}</span>
              {on
                ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold px-2 py-0.5"><Check className="w-3 h-3" /> Active</span>
                : <span className="rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold px-2 py-0.5">Not active</span>}
            </div>
            <p className="font-extrabold text-[#0B1F4D] mt-2">{m.label}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
            <div className="flex items-center gap-3 mt-3">
              {on ? (
                <>
                  <Link href={m.href} className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F4D] hover:underline">Open <ArrowRight className="w-3 h-3" /></Link>
                  {m.key !== 'outlet' && m.key !== 'marketplace' && (
                    <button onClick={() => toggle(m.key, false)} disabled={busy === m.key} className="text-xs text-gray-400 hover:text-red-500">{busy === m.key ? '…' : 'Deactivate'}</button>
                  )}
                </>
              ) : (
                <button onClick={() => toggle(m.key, true)} disabled={busy === m.key}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5A623] text-[#0B1F4D] px-4 py-2 text-xs font-bold hover:bg-[#fbb93a] transition-colors disabled:opacity-60">
                  {busy === m.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Activate
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
