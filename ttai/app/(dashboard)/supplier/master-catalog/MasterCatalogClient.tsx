'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ImageOff, Check, X, PackagePlus, Layers } from 'lucide-react'
import { CONDITIONS } from '@/lib/conditions'

type Master = {
  id: string; name: string; brand: string | null; model: string | null; ean: string | null
  category: string | null; image: string | null; mine?: boolean
  capacity?: string | null; color?: string | null; region?: string | null
}
type Options = { brands: string[]; models: string[]; capacities: string[]; colors: string[]; regions: string[]; count: number; matches: Master[] }
type Selection = { brand?: string; model?: string; capacity?: string; color?: string; region?: string }

const EMPTY_FORM = { price: '', stock: '', sku: '', condition: CONDITIONS[0] as string, warehouse: '', warranty: '', imei: '' }

export function MasterCatalogClient() {
  const router = useRouter()
  const [tab, setTab] = useState<'search' | 'variant'>('search')

  // search mode
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Master[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // variant mode
  const [sel, setSel] = useState<Selection>({})
  const [opts, setOpts] = useState<Options | null>(null)
  const [optLoading, setOptLoading] = useState(false)

  // shared import modal
  const [importing, setImporting] = useState<Master | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
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

  async function loadOptions(selection: Selection) {
    setOptLoading(true); setError(null)
    const res = await fetch('/api/supplier/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'options', selection }) })
    const j = await res.json().catch(() => ({}))
    setOptLoading(false)
    if (!res.ok) { setError(j.error ?? 'Could not load options'); setOpts(null); return }
    setOpts(j)
  }

  // Load the first level (brands) when entering variant mode.
  useEffect(() => { if (tab === 'variant' && !opts) loadOptions({}) }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pick a value for a dimension; clear everything downstream and reload.
  function pick(dim: keyof Selection, value: string) {
    const order: (keyof Selection)[] = ['brand', 'model', 'capacity', 'color', 'region']
    const idx = order.indexOf(dim)
    const next: Selection = {}
    for (let i = 0; i < idx; i++) { const k = order[i]; if (sel[k]) next[k] = sel[k] }
    if (value) next[dim] = value
    setSel(next)
    loadOptions(next)
  }

  function resetVariant() { setSel({}); loadOptions({}) }

  async function submitImport() {
    if (!importing) return
    setSaving(true)
    const action = importing.id ? 'import' : 'copyProduct'
    const res = await fetch('/api/supplier/master', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, masterId: importing.id, price: parseFloat(form.price) || 0, stock: form.stock, sku: form.sku, condition: form.condition, warehouse: form.warehouse, warranty: form.warranty, imei: form.imei }),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { alert(j.error ?? 'Import failed'); return }
    setResults((rs) => rs?.map((r) => (r.id === importing.id ? { ...r, mine: true } : r)) ?? null)
    setImporting(null); setForm({ ...EMPTY_FORM })
    if (j.productId) router.push(`/supplier/products/${j.productId}/edit`)
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm'

  function VariantSelect({ dim, label, options }: { dim: keyof Selection; label: string; options: string[] }) {
    if (!options.length && !sel[dim]) return null
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-gray-500 uppercase">{label}</label>
        <select value={sel[dim] ?? ''} onChange={(e) => pick(dim, e.target.value)} className={inputCls + ' bg-white'}>
          <option value="">Any</option>
          {sel[dim] && !options.includes(sel[dim]!) && <option value={sel[dim]}>{sel[dim]}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button onClick={() => setTab('search')} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold ${tab === 'search' ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500'}`}><Search className="w-4 h-4" /> Search</button>
        <button onClick={() => setTab('variant')} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold ${tab === 'variant' ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500'}`}><Layers className="w-4 h-4" /> Build by variant</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ── SEARCH ────────────────────────────────────────────────────────── */}
      {tab === 'search' && (
        <>
          <form onSubmit={search} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, brand, model or EAN… (e.g. iPhone 15 Pro)"
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]" />
            </div>
            <button type="submit" disabled={loading} className="rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {results && (results.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No products found. Products you and others add are indexed here automatically.</p>
          ) : (
            <ResultGrid items={results} onImport={(m) => setImporting(m)} />
          ))}

          {!results && (
            <p className="text-sm text-gray-400">
              Can&apos;t find a product? <Link href="/supplier/products/new" className="font-bold text-[#0B1F4D] hover:underline">Create it</Link> — it&apos;s added to the master catalog automatically for others to reuse.
            </p>
          )}
        </>
      )}

      {/* ── VARIANT CASCADE ───────────────────────────────────────────────── */}
      {tab === 'variant' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#0B1F4D]">Pick a combination</p>
              {Object.keys(sel).length > 0 && <button onClick={resetVariant} className="text-xs font-semibold text-gray-400 hover:text-gray-700">Reset</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <VariantSelect dim="brand" label="Brand" options={opts?.brands ?? []} />
              <VariantSelect dim="model" label="Model" options={opts?.models ?? []} />
              <VariantSelect dim="capacity" label="Capacity" options={opts?.capacities ?? []} />
              <VariantSelect dim="color" label="Color" options={opts?.colors ?? []} />
              <VariantSelect dim="region" label="Region" options={opts?.regions ?? []} />
            </div>
            {optLoading && <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</p>}
          </div>

          {opts && (opts.matches.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No matching master products yet. <Link href="/supplier/products/new" className="font-bold text-[#0B1F4D] hover:underline">Create one</Link>.</p>
          ) : (
            <>
              <p className="text-xs text-gray-400">{opts.count} matching product{opts.count !== 1 ? 's' : ''}</p>
              <ResultGrid items={opts.matches} onImport={(m) => setImporting(m)} />
            </>
          ))}
        </div>
      )}

      {/* ── Import modal (shared) ─────────────────────────────────────────── */}
      {importing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setImporting(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-[#0B1F4D]">{importing.name}</p>
                <p className="text-xs text-gray-400">{[importing.brand, importing.model, importing.capacity, importing.color, importing.region].filter(Boolean).join(' · ')}</p>
              </div>
              <button onClick={() => setImporting(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-400">Name, brand, images, description &amp; specs are copied automatically. Add your details:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Price (€) *</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Supplier SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Condition</label>
                <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputCls + ' bg-white'}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Warranty</label><input value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="e.g. 12 months" className={inputCls} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">IMEI <span className="text-gray-300 normal-case">(opt.)</span></label><input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Warehouse location</label><input value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} placeholder="e.g. Madrid · Aisle 4" className={inputCls} /></div>
            </div>
            <button onClick={submitImport} disabled={saving} className="w-full rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Import to my catalogue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultGrid({ items, onImport }: { items: Master[]; onImport: (m: Master) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((m) => (
        <div key={m.id} className="rounded-2xl border border-gray-100 bg-white p-3">
          <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2 flex items-center justify-center">
            {m.image ? <Image src={m.image} alt="" fill className="object-contain p-1" sizes="160px" /> : <ImageOff className="w-5 h-5 text-gray-300" />}
          </div>
          <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{m.name}</p>
          <p className="text-[11px] text-gray-400 mb-2">{[m.brand, m.model, m.capacity, m.color, m.region, m.category].filter(Boolean).join(' · ')}</p>
          {m.mine ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700"><Check className="w-3 h-3" /> In your catalogue</span>
          ) : (
            <button onClick={() => onImport(m)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F5A623] text-[#0B1F4D] px-3 py-1.5 text-xs font-extrabold hover:bg-[#fbb93a]">
              <PackagePlus className="w-3.5 h-3.5" /> Import
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
