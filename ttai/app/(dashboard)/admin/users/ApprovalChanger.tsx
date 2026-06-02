'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Clock, ChevronDown, Loader2 } from 'lucide-react'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

const CFG: Record<ApprovalStatus, { label: string; pill: string; dot: string; Icon: typeof Check }> = {
  pending:  { label: 'Pending',  pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', Icon: Clock },
  approved: { label: 'Approved', pill: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', Icon: Check },
  rejected: { label: 'Rejected', pill: 'bg-red-50  text-red-600  border-red-200',    dot: 'bg-red-500',   Icon: X },
}

export function ApprovalChanger({
  userId,
  currentStatus,
}: {
  userId: string
  currentStatus: ApprovalStatus
}) {
  const [status, setStatus] = useState<ApprovalStatus>(currentStatus)
  const [busy, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const ref = useRouter()
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  function change(next: ApprovalStatus) {
    setMenuOpen(false)
    if (next === status) return
    startTransition(async () => {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: next }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error ?? 'Failed to update approval status')
        return
      }
      setStatus(next)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1800)
      ref.refresh()
    })
  }

  // ── PENDING → clear primary actions ──
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => change('approved')}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Approve
        </button>
        <button
          onClick={() => change('rejected')}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>
    )
  }

  // ── APPROVED / REJECTED → status pill + change dropdown ──
  const cfg = CFG[status]
  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${cfg.pill} hover:brightness-95`}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : justSaved ? <Check className="w-3.5 h-3.5" />
          : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
        {justSaved ? 'Saved' : cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-20">
          {(['approved', 'pending', 'rejected'] as ApprovalStatus[])
            .filter((s) => s !== status)
            .map((s) => {
              const c = CFG[s]
              return (
                <button
                  key={s}
                  onClick={() => change(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <c.Icon className={`w-3.5 h-3.5 ${
                    s === 'approved' ? 'text-green-600' : s === 'rejected' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  {s === 'approved' ? 'Approve' : s === 'rejected' ? 'Reject' : 'Set to pending'}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
