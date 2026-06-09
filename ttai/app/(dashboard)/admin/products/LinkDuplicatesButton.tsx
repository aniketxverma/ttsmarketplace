'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, GitMerge } from 'lucide-react'

/** Admin: collapse duplicate products onto shared master records (by EAN / name+brand). */
export function LinkDuplicatesButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function run() {
    if (!confirm('Scan all products and merge duplicates (same EAN, or same name + brand) onto one master listing? This is safe to run repeatedly.')) return
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/link-duplicates', { method: 'POST' })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setMsg(j.error ?? 'Failed'); return }
    setMsg(`Scanned ${j.total} · merged ${j.groupsMerged} duplicate group${j.groupsMerged === 1 ? '' : 's'} · ${j.linked} product${j.linked === 1 ? '' : 's'} relinked`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
        Merge duplicates
      </button>
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  )
}
