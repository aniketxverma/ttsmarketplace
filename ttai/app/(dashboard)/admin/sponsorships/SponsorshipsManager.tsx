'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, X, Loader2 } from 'lucide-react'

type Opt = { id: string; name: string }
type Placement = { id: string; weight: number; ends_at: string | null; is_active: boolean; product: string; category: string }

export function SponsorshipsManager({ placements, products, categories }: { placements: Placement[]; products: Opt[]; categories: Opt[] }) {
  const router = useRouter()
  const [productId, setProductId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [weight, setWeight] = useState('100')
  const [endsAt, setEndsAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    if (!productId) return
    setBusy(true); setError(null)
    const res = await fetch('/api/admin/sponsorships', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', productId, categoryId, weight, endsAt: endsAt || null }),
    })
    setBusy(false)
    if (!res.ok) { setError((await res.json().catch(() => ({})))?.error ?? 'Failed'); return }
    setProductId(''); setCategoryId(''); setEndsAt(''); router.refresh()
  }
  async function remove(id: string) {
    await fetch('/api/admin/sponsorships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', id }) })
    router.refresh()
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
        <p className="font-bold text-[#0B1F4D] flex items-center gap-2"><Star className="w-4 h-4 text-[#F5A623]" /> Sponsor a product</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Product *</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
              <option value="">Choose product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Category (optional)</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Weight</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Ends</label>
              <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={add} disabled={!productId || busy} className="rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Make sponsored'}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <p className="font-bold text-[#0B1F4D] mb-4">Active placements ({placements.length})</p>
        {placements.length === 0 ? (
          <p className="text-sm text-gray-400">No sponsored products yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {placements.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[#0B1F4D] text-sm truncate">{p.product}</p>
                  <p className="text-xs text-gray-400">{p.category} · weight {p.weight}{p.ends_at ? ` · ends ${new Date(p.ends_at).toLocaleDateString('es-ES')}` : ''}</p>
                </div>
                <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
