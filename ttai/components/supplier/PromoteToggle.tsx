'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Star, Loader2 } from 'lucide-react'

export function PromoteToggle({ productId, initialOn }: { productId: string; initialOn: boolean }) {
  const t = useT()
  const router = useRouter()
  const [on, setOn] = useState(initialOn)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    const next = !on
    const res = await fetch('/api/supplier/promote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, on: next }),
    })
    setBusy(false)
    if (!res.ok) { alert((await res.json().catch(() => ({})))?.error ?? 'Failed'); return }
    setOn(next); router.refresh()
  }

  return (
    <div className="rounded-xl border bg-card p-6 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 text-[#F5A623]" />
        </div>
        <div>
          <p className="font-bold text-[#0B1F4D] text-sm">{t("Promote this product")} {on && <span className="ml-1 text-[10px] font-extrabold bg-[#F5A623] text-[#0B1F4D] px-1.5 py-0.5 rounded-full">★ Sponsored</span>}</p>
          <p className="text-xs text-gray-400 mt-0.5">Sponsored products appear first in the marketplace and category sections. A paid placement.</p>
        </div>
      </div>
      <button type="button" onClick={toggle} disabled={busy}
        className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${on ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]'}`}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : on ? 'Stop promoting' : 'Promote'}
      </button>
    </div>
  )
}
