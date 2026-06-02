'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export function ApprovalChanger({
  userId,
  currentStatus,
}: {
  userId: string
  currentStatus: ApprovalStatus
}) {
  const [status, setStatus] = useState<ApprovalStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleChange(newStatus: ApprovalStatus) {
    if (newStatus === status) return
    startTransition(async () => {
      // Route through the admin API (admin client) so the update always persists
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error ?? 'Failed to update approval status')
        return
      }
      setStatus(newStatus)
      router.refresh()
    })
  }

  const statusConfig: Record<ApprovalStatus, { label: string; color: string }> = {
    pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', color: 'bg-red-100  text-red-700  border-red-200'  },
  }

  const cfg = statusConfig[status]

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Status badge */}
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
        {cfg.label}
      </span>

      {/* Action buttons (only show relevant ones) */}
      {status !== 'approved' && (
        <button
          disabled={isPending}
          onClick={() => handleChange('approved')}
          className="rounded-lg bg-green-600 text-white px-2.5 py-1 text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Approve
        </button>
      )}
      {status !== 'rejected' && (
        <button
          disabled={isPending}
          onClick={() => handleChange('rejected')}
          className="rounded-lg bg-red-500 text-white px-2.5 py-1 text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          Reject
        </button>
      )}
      {status !== 'pending' && (
        <button
          disabled={isPending}
          onClick={() => handleChange('pending')}
          className="rounded-lg bg-gray-200 text-gray-700 px-2.5 py-1 text-xs font-bold hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  )
}
