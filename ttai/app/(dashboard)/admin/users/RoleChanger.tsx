'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ROLES = ['buyer', 'business_client', 'supplier', 'broker', 'admin']

export function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleChange(newRole: string) {
    if (newRole === role) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('profiles').update({ role: newRole as any }).eq('id', userId)
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
