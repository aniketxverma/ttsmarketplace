'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MANAGERS, STATUSES } from '@/lib/control-center'

export function TicketControls({ id, status, assignedTo }: { id: string; status: string; assignedTo: string | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function patch(body: Record<string, string>) {
    setSaving(true)
    await fetch('/api/admin/ticket', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs font-bold text-gray-500">
        Status
        <select
          defaultValue={status}
          disabled={saving}
          onChange={(e) => patch({ status: e.target.value })}
          className="ml-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-800 focus:border-[#0B1F4D] outline-none"
        >
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </label>

      <label className="text-xs font-bold text-gray-500">
        Assigned to
        <select
          defaultValue={assignedTo ?? ''}
          disabled={saving}
          onChange={(e) => patch({ assignedTo: e.target.value })}
          className="ml-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-800 focus:border-[#0B1F4D] outline-none"
        >
          {!assignedTo && <option value="">— unassigned —</option>}
          {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>

      {saving && <span className="text-xs text-gray-400">Saving…</span>}
    </div>
  )
}

export function NoteForm({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function add() {
    if (!note.trim()) return
    setSaving(true)
    await fetch('/api/admin/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, note }),
    })
    setNote('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') add() }}
        placeholder="Add an internal note…"
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0B1F4D] outline-none"
      />
      <button
        onClick={add}
        disabled={saving || !note.trim()}
        className="rounded-lg bg-[#0B1F4D] text-white px-4 py-2 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-50"
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
    </div>
  )
}
