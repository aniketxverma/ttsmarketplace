'use client'

import { useState } from 'react'

/** Admin "Login as" — opens a session AS the target user (in this tab). */
export function ImpersonateButton({ userId, name }: { userId: string; name: string }) {
  const [busy, setBusy] = useState(false)

  async function go() {
    if (busy) return
    if (!confirm(`Log in as ${name}? Your admin session will be replaced — you'll need to log back in as admin afterwards.`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { alert(data.error || 'Could not log in as this user'); setBusy(false); return }
      window.location.href = data.url
    } catch { alert('Something went wrong'); setBusy(false) }
  }

  return (
    <button type="button" onClick={go} disabled={busy}
      className="text-[11px] font-semibold text-[#5b3fd6] hover:underline flex items-center gap-1 disabled:opacity-50">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {busy ? 'Logging in…' : 'Log in as'}
    </button>
  )
}
