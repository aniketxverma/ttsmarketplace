'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrokerSchema } from '@/lib/validation/schemas'

export default function BrokerRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ legalName: '', taxId: '', vatNumber: '', taxJurisdiction: 'ES' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const parsed = createBrokerSchema.safeParse(form)
    if (!parsed.success) { setError(parsed.error.errors[0].message); setLoading(false); return }

    const res = await fetch('/api/brokers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    router.push('/broker/onboarding')
  }

  const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Register as Broker</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Apply to join the TTAI broker network</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Legal Name *</label>
            <input className={inputCls} value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tax ID (NIF/CIF) *</label>
            <input className={inputCls} value={form.taxId} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">VAT Number</label>
            <input className={inputCls} placeholder="Optional" value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tax Jurisdiction (Country ISO)</label>
            <input className={inputCls} maxLength={2} value={form.taxJurisdiction} onChange={(e) => setForm((f) => ({ ...f, taxJurisdiction: e.target.value.toUpperCase() }))} />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Apply as Broker'}
          </button>
        </form>
      </div>
    </div>
  )
}
