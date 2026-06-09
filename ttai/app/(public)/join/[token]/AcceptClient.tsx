'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'

export function AcceptClient({ token, inviterName }: { token: string; inviterName: string }) {
  const router = useRouter()
  const [importCatalog, setImportCatalog] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setBusy(true); setError(null)
    const res = await fetch('/api/network/accept', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, importCatalog }),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(j.error ?? 'Could not accept invitation'); return }
    router.push('/supplier?joined=1')
  }

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-amber-50/50 px-3.5 py-3 cursor-pointer hover:border-[#F5A623] transition-colors">
        <input type="checkbox" checked={importCatalog} onChange={(e) => setImportCatalog(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#F5A623]" />
        <span className="text-sm text-gray-700 leading-snug">
          <span className="font-bold text-[#0B1F4D]">Import {inviterName}&apos;s products into my store</span><br />
          <span className="text-xs text-gray-500">Their catalogue, images, descriptions &amp; prices appear in your shop automatically.</span>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={accept} disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-extrabold hover:bg-[#162d6e] disabled:opacity-50">
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : <><Check className="w-4 h-4" /> Accept &amp; join the network</>}
      </button>
    </div>
  )
}
