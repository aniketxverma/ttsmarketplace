'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { StateTransitionModal } from '@/components/admin/StateTransitionModal'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:      ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ACTIVE', 'PENDING', 'SUSPENDED'],
  ACTIVE:       ['SUSPENDED'],
  SUSPENDED:    ['ACTIVE', 'PENDING'],
}

const BUTTON_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Move to Review',
  ACTIVE:       'Approve',
  PENDING:      'Request More Info',
  SUSPENDED:    'Suspend / Reject',
}

export default function AdminSupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [supplier, setSupplier] = useState<Record<string, unknown> | null>(null)
  const [docs, setDocs] = useState<{ id: string; doc_type: string; file_url: string; uploaded_at: string }[]>([])
  const [audits, setAudits] = useState<{ id: string; from_status: string | null; to_status: string; reason: string | null; created_at: string }[]>([])
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/suppliers/${id}`)
      .then((r) => r.json())
      .then(({ supplier: s, documents, audits: a }) => {
        setSupplier(s)
        setDocs(documents ?? [])
        setAudits(a ?? [])
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>
  if (!supplier) return <div className="text-muted-foreground text-sm">Supplier not found</div>

  const status = supplier.status as string
  const allowed = ALLOWED_TRANSITIONS[status] ?? []

  function handleTransitionSuccess(newStatus: string) {
    setSupplier((prev) => prev ? { ...prev, status: newStatus } : prev)
    setTransitioning(null)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{supplier.legal_name as string}</h1>
          {supplier.trade_name && <p className="text-muted-foreground text-sm">{supplier.trade_name as string}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <div className="flex gap-2">
            {allowed.map((target) => (
              <button
                key={target}
                onClick={() => setTransitioning(target)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium border hover:bg-accent ${
                  target === 'ACTIVE' ? 'border-green-500 text-green-700 hover:bg-green-50' :
                  target === 'SUSPENDED' ? 'border-red-500 text-red-700 hover:bg-red-50' : ''
                }`}
              >
                {BUTTON_LABELS[target] ?? target}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
            <h2 className="font-semibold">Company Info</h2>
            {[
              ['Tax ID', supplier.tax_id as string],
              ['VAT Number', supplier.vat_number as string ?? '—'],
              ['Marketplace', supplier.marketplace_context as string],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-sm">Documents ({docs.length})</h2>
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
              </div>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>
            </div>
          ))}
          {!docs.length && <p className="text-sm text-muted-foreground">No documents uploaded</p>}
        </div>

        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-sm">Audit Trail</h2>
          {audits.map((a) => (
            <div key={a.id} className="text-xs border-l-2 border-muted pl-3 py-1">
              <div className="flex items-center gap-1">
                {a.from_status && <><StatusBadge status={a.from_status} /><span>→</span></>}
                <StatusBadge status={a.to_status} />
              </div>
              {a.reason && <p className="text-muted-foreground mt-0.5">{a.reason}</p>}
              <p className="text-muted-foreground/70 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
          {!audits.length && <p className="text-sm text-muted-foreground">No history</p>}
        </div>
      </div>

      {supplier.description && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Description</h2>
          <p className="text-sm text-muted-foreground">{supplier.description as string}</p>
        </div>
      )}

      {transitioning && (
        <StateTransitionModal
          supplierId={id}
          targetStatus={transitioning}
          onSuccess={handleTransitionSuccess}
          onClose={() => setTransitioning(null)}
        />
      )}
    </div>
  )
}
