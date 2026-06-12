'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Rocket, Loader2, Check } from 'lucide-react'

/** Admin switch: keep the marketplace in Pre-Opening, or open it (Opening Day). */
export function MarketplacePhaseToggle({ initial, launchDate }: { initial: boolean; launchDate: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(initial)
  const [busy, setBusy] = useState(false)
  // datetime-local needs 'YYYY-MM-DDTHH:mm' in local time.
  const toLocal = (iso: string) => { const d = new Date(iso); const off = d.getTimezoneOffset(); return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16) }
  const [date, setDate] = useState(() => { try { return toLocal(launchDate) } catch { return '' } })
  const [savedDate, setSavedDate] = useState(false)

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

  async function saveDate() {
    setBusy(true); setSavedDate(false)
    const res = await fetch('/api/admin/marketplace-phase', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ launchDate: new Date(date).toISOString() }),
    })
    setBusy(false)
    if (res.ok) { setSavedDate(true); setTimeout(() => setSavedDate(false), 2500); router.refresh() }
    else alert('Could not save launch date')
  }

  return (
    <div className="space-y-3">
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

    {!open && (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Launch date &amp; time</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold text-[#0B1F4D] focus:border-[#0B1F4D] focus:outline-none" />
          <p className="text-[11px] text-gray-400 mt-1.5">Drives the live “Opening Soon” countdown on the homepage.</p>
        </div>
        <button onClick={saveDate} disabled={busy || !date}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[#13306e] disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : savedDate ? <Check className="w-4 h-4" /> : null}
          {savedDate ? 'Saved' : 'Save date'}
        </button>
      </div>
    )}
    </div>
  )
}
