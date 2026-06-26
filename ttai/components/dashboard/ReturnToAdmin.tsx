'use client'

import { useState } from 'react'

/** Sticky banner shown while an admin is impersonating a user. */
export function ReturnToAdmin({ label }: { label: string }) {
  const [busy, setBusy] = useState(false)

  async function back() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/return', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) { alert(data.error || 'Could not return to admin'); setBusy(false); return }
      window.location.href = data.url
    } catch { alert('Something went wrong'); setBusy(false) }
  }

  return (
    <div className="bg-[#5b3fd6] text-white">
      <div className="container mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-semibold truncate">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <span className="truncate">Viewing as <strong>{label}</strong> (admin impersonation)</span>
        </span>
        <button type="button" onClick={back} disabled={busy}
          className="flex-shrink-0 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-bold transition-colors disabled:opacity-60">
          {busy ? 'Returning…' : '← Return to admin'}
        </button>
      </div>
    </div>
  )
}
