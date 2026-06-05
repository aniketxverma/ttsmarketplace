'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = ['buyer', 'business_client', 'supplier', 'broker', 'admin']

export function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleChange(newRole: string) {
    if (newRole === role) return
    startTransition(async () => {
      // Server route — RLS blocks an admin from updating another user's profile client-side.
      const res = await fetch('/api/admin/user-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({})))?.error ?? 'Failed to update role'); return }
      setRole(newRole)
      router.refresh()
    })
  }

  return (
    <select
      value={role}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0B1F4D] disabled:opacity-60 cursor-pointer"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  )
}
