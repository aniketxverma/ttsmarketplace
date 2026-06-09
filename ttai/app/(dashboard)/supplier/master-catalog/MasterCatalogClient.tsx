'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ImageOff, Check, X, PackagePlus } from 'lucide-react'

type Master = { id: string; name: string; brand: string | null; family: string | null; model: string | null; ean: string | null; category: string | null; image: string | null; mine: boolean }

export function MasterCatalogClient() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Master[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [importing, setImporting] = useState<Master | null>(null)
  const [form, setForm] = useState({ price: '', stock: '', sku: '', condition: 'New', warehouse: '' })
  const [saving, setSaving] = useState(false)

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/supplier/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'search', q }) })
    const j = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(j.error ?? 'Search failed'); setResults([]); return }
    setResults(j.products ?? [])
  }

  async function doImport() {
    if (!importing) return
    setSaving(true)
    const res = await fetch('/api/supplier/master', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', masterId: importing.id, price: parseFloat(form.price) || 0, stock: form.stock, sku: form.sku, condition: form.condition, warehouse: form.warehouse }),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { alert(j.error ?? 'Import failed'); return }
    setResults((rs) => rs?.map((r) => (r.id === importing.id ? { ...r, mine: true } : r)) ?? null)
    setImporting(null); setForm({ price: '', stock: '', sku: '', condition: 'New', warehouse: '' })
    if (j.productId) router.push(`/supplier/products/${j.productId}/edit`)
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm'

  return (
    <div className="space-y-5">
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, brand, model or EAN… (e.g. JBL T110)"
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
        </div>
        <button type="submit" disabled={loading} className="rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results && (results.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No products found. Products you and others add are indexed here automatically.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {results.map((m) => (
            <div key={m.id} className="rounded-2xl border border-gray-100 bg-white p-3">
              <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2 flex items-center justify-center">
                {m.image ? <Image src={m.image} alt="" fill className="object-contain p-1" sizes="160px" /> : <ImageOff className="w-5 h-5 text-gray-300" />}
              </div>
              <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{m.name}</p>
              <p className="text-[11px] text-gray-400 mb-2">{[m.brand, m.model, m.category].filter(Boolean).join(' · ')}</p>
              {m.mine ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700"><Check className="w-3 h-3" /> In your catalogue</span>
              ) : (
                <button onClick={() => setImporting(m)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F5A623] text-[#0B1F4D] px-3 py-1.5 text-xs font-extrabold hover:bg-[#fbb93a]">
                  <PackagePlus className="w-3.5 h-3.5" /> Import
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Import modal */}
      {importing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setImporting(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-[#0B1F4D]">{importing.name}</p>
                <p className="text-xs text-gray-400">{[importing.brand, importing.model].filter(Boolean).join(' · ')}</p>
              </div>
              <button onClick={() => setImporting(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-400">Name, brand, images, description &amp; specs are copied from the master. Add your details:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Price (€) *</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Condition</label>
                <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputCls + ' bg-white'}>
                  {['New', 'Refurbished', 'Used', 'Grade A', 'Grade B', 'Grade C'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Warehouse location</label><input value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} placeholder="e.g. Madrid · Aisle 4" className={inputCls} /></div>
            </div>
            <button onClick={doImport} disabled={saving} className="w-full rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Import to my catalogue'}
            </button>
          </div>
        </div>
      )}

      {!results && (
        <p className="text-sm text-gray-400">
          Can&apos;t find a product? <Link href="/supplier/products/new" className="font-bold text-[#0B1F4D] hover:underline">Create it</Link> — it&apos;s added to the master catalog automatically for others to reuse.
        </p>
      )}
    </div>
  )
}
