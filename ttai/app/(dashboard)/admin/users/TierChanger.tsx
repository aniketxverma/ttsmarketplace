'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const TIERS: { v: string; label: string }[] = [
  { v: 'free',     label: 'Free' },
  { v: 'standard', label: 'Standard' },
  { v: 'pro',      label: 'Pro' },
  { v: 'full',     label: 'Full pack' },
]

const TIER_CLS: Record<string, string> = {
  free:     'border-gray-200 text-gray-500',
  standard: 'border-blue-300 text-blue-700 bg-blue-50',
  pro:      'border-violet-300 text-violet-700 bg-violet-50',
  full:     'border-amber-300 text-amber-700 bg-amber-50',
}

export function TierChanger({ userId, currentTier }: { userId: string; currentTier: string }) {
  const [tier, setTier] = useState(currentTier || 'free')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(newTier: string) {
    if (newTier === tier) return
    startTransition(async () => {
      // Server route — RLS blocks an admin from updating another user's profile client-side.
      const res = await fetch('/api/admin/user-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: newTier }),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({})))?.error ?? 'Failed to update plan'); return }
      setTier(newTier)
      router.refresh()
    })
  }

  return (
    <select
      value={tier}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-lg border px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] disabled:opacity-60 cursor-pointer ${TIER_CLS[tier] ?? TIER_CLS.free}`}
    >
      {TIERS.map((t) => (
        <option key={t.v} value={t.v}>{t.label}</option>
      ))}
    </select>
  )
}
