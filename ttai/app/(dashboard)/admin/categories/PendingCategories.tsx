'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Pencil, Loader2 } from 'lucide-react'

interface Pending { id: string; name: string; requested_by_name?: string | null }
interface Opt { id: string; name: string }

export function PendingCategories({ pending, roots }: { pending: Pending[]; roots: Opt[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusy(id)
    try {
      const res = await fetch('/api/admin/category', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || 'Action failed') }
      else router.refresh()
    } finally { setBusy(null) }
  }

  if (pending.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <h2 className="font-bold text-amber-900">Pending category requests</h2>
        <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{pending.length}</span>
      </div>
      <div className="divide-y divide-amber-100">
        {pending.map((c) => (
          <div key={c.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{c.name}</p>
              {c.requested_by_name && <p className="text-xs text-gray-500">Requested by {c.requested_by_name}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={() => act(c.id, 'approve')} disabled={busy === c.id}
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-green-700 disabled:opacity-50">
                {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
              </button>
              <button onClick={() => { const n = prompt('Rename category', c.name); if (n?.trim()) act(c.id, 'rename', { name: n.trim() }) }} disabled={busy === c.id}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <Pencil className="w-3.5 h-3.5" /> Rename
              </button>
              {/* Make subcategory of */}
              <select defaultValue="" disabled={busy === c.id}
                onChange={(e) => { if (e.target.value) act(c.id, 'set_parent', { parentId: e.target.value }) }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600">
                <option value="">Sub-category of…</option>
                {roots.filter((r) => r.id !== c.id).map((r) => <option key={r.id} value={r.id}>↳ under {r.name}</option>)}
              </select>
              {/* Merge into */}
              <select defaultValue="" disabled={busy === c.id}
                onChange={(e) => { if (e.target.value && confirm('Merge this request into the selected category? Its products move over and this one is removed.')) act(c.id, 'merge', { targetId: e.target.value }) }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600">
                <option value="">Merge into…</option>
                {roots.filter((r) => r.id !== c.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button onClick={() => { if (confirm('Reject this category request?')) act(c.id, 'reject') }} disabled={busy === c.id}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
