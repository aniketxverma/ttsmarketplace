'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Supplier {
  id: string
  legal_name: string
  status: string
}

interface Assignment {
  supplier_id: string
  assigned_at: string
  suppliers: Supplier | null
}

export default function AdminBrokerAssignmentsPage() {
  const params = useParams<{ id: string }>()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [aRes, sRes] = await Promise.all([
      fetch(`/api/admin/brokers/${params.id}/assign-supplier`),
      fetch('/api/admin/suppliers?status=ACTIVE&limit=200'),
    ])
    const [aData, sData] = await Promise.all([aRes.json(), sRes.json()])
    setAssignments(aData.assignments ?? [])
    setAllSuppliers(sData.suppliers ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [params.id])

  async function handleAssign() {
    if (!selectedSupplierId) return
    setSaving(true); setError(null)
    const res = await fetch(`/api/admin/brokers/${params.id}/assign-supplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: selectedSupplierId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setSelectedSupplierId('')
    await load()
    setSaving(false)
  }

  async function handleRemove(supplierId: string) {
    setSaving(true); setError(null)
    const res = await fetch(`/api/admin/brokers/${params.id}/assign-supplier`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: supplierId }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error) }
    await load()
    setSaving(false)
  }

  const assigned = new Set(assignments.map((a) => a.supplier_id))
  const available = allSuppliers.filter((s) => !assigned.has(s.id))

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Manage Assignments</h1>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Assign Supplier</h2>
        <div className="flex gap-2">
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select supplier...</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>{s.legal_name}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedSupplierId || saving}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Current Assignments ({assignments.length})</h2>
        {assignments.length ? (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.supplier_id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{a.suppliers?.legal_name ?? a.supplier_id}</p>
                  <p className="text-xs text-muted-foreground">Since {new Date(a.assigned_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleRemove(a.supplier_id)}
                  disabled={saving}
                  className="text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No suppliers assigned</p>
        )}
      </div>
    </div>
  )
}
