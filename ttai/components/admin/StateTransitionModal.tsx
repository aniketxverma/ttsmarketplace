'use client'

import { useState } from 'react'

interface StateTransitionModalProps {
  supplierId: string
  targetStatus: string
  onSuccess: (newStatus: string) => void
  onClose: () => void
}

export function StateTransitionModal({
  supplierId,
  targetStatus,
  onSuccess,
  onClose,
}: StateTransitionModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.length < 5) { setError('Reason must be at least 5 characters'); return }
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/suppliers/${supplierId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus, reason }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to transition')
      setLoading(false)
      return
    }

    onSuccess(targetStatus)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md space-y-4">
        <h2 className="font-semibold">Transition to {targetStatus}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Reason *</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Explain the reason for this status change (min 5 chars)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={5}
            />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Confirming...' : `Confirm → ${targetStatus}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
