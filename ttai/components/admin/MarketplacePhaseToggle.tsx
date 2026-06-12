'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Rocket, Loader2 } from 'lucide-react'

/** Admin switch: keep the marketplace in Pre-Opening, or open it (Opening Day). */
export function MarketplacePhaseToggle({ initial }: { initial: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function set(next: boolean) {
    if (next && !confirm('Open the marketplace? This starts verification, enables Verified badges, B2B access and promotions for approved businesses.')) return
    setBusy(true)
    const res = await fetch('/api/admin/marketplace-phase', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ open: next }),
    })
    setBusy(false)
    if (res.ok) { setOpen(next); router.refresh() }
    else alert('Could not update marketplace phase')
  }

  return (
    <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${open ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${open ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>
          {open ? <Rocket className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-bold text-[#0B1F4D]">
            Marketplace phase: {open ? 'OPEN (live)' : 'Pre-Opening'}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
            {open
              ? 'Verification, Verified badges, B2B access and promotions are active.'
              : 'All shops are public & independent but show a “Verification Pending” notice. No verified status or promotions until you open.'}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        {open ? (
          <button onClick={() => set(false)} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Back to Pre-Opening
          </button>
        ) : (
          <button onClick={() => set(true)} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-extrabold hover:bg-green-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Open Marketplace
          </button>
        )}
      </div>
    </div>
  )
}
