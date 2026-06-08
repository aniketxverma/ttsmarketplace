'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Download, Share2, X, ImageOff, PackageSearch } from 'lucide-react'

type Sup = { id: string; name: string }
type SrcProduct = { id: string; name: string; price_cents: number; currency_code: string; brand: string | null; category: string | null; image: string | null; imported: boolean }

const fmt = (c: number, cur: string) => new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur || 'EUR' }).format((c || 0) / 100)

export function SourcingClient({ sharedWithMe, myTargets, grantable }: { sharedWithMe: Sup[]; myTargets: Sup[]; grantable: Sup[] }) {
  const router = useRouter()
  const [openSource, setOpenSource] = useState<Sup | null>(null)
  const [products, setProducts] = useState<SrcProduct[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [q, setQ] = useState('')
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [grantTo, setGrantTo] = useState('')
  const [granting, setGranting] = useState(false)

  async function openCatalogue(src: Sup) {
    setOpenSource(src); setProducts(null); setSel(new Set()); setQ(''); setMsg(null); setLoading(true)
    const res = await fetch('/api/supplier/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list', sourceSupplierId: src.id }) })
    const j = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setMsg(j.error ?? 'Could not load catalogue'); return }
    setProducts(j.products ?? [])
  }

  const filtered = (products ?? []).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(q.toLowerCase()))
  const importable = filtered.filter((p) => !p.imported)
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAll = () => setSel(new Set(importable.map((p) => p.id)))

  async function runImport() {
    if (!openSource || sel.size === 0) return
    setImporting(true); setMsg(null)
    const res = await fetch('/api/supplier/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', sourceSupplierId: openSource.id, productIds: Array.from(sel) }) })
    const j = await res.json().catch(() => ({}))
    setImporting(false)
    if (!res.ok) { setMsg(j.error ?? 'Import failed'); return }
    setMsg(`Imported ${j.created} products as drafts.`)
    setProducts((ps) => ps?.map((p) => (sel.has(p.id) ? { ...p, imported: true } : p)) ?? null)
    setSel(new Set())
    router.refresh()
  }

  async function grant() {
    if (!grantTo) return
    setGranting(true)
    await fetch('/api/supplier/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'grant', targetSupplierId: grantTo }) })
    setGranting(false); setGrantTo(''); router.refresh()
  }
  async function revoke(id: string) {
    await fetch('/api/supplier/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revoke', targetSupplierId: id }) })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Import from suppliers sharing with me */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <h2 className="font-bold text-[#0B1F4D] flex items-center gap-2 mb-1"><Download className="w-4 h-4" /> Import from shared catalogues</h2>
        <p className="text-xs text-gray-400 mb-4">Suppliers who let you resell their products. Open a catalogue and import the items you want.</p>
        {sharedWithMe.length === 0 ? (
          <p className="text-sm text-gray-400">No supplier has shared their catalogue with you yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sharedWithMe.map((s) => (
              <button key={s.id} onClick={() => openCatalogue(s)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${openSource?.id === s.id ? 'border-[#0B1F4D] bg-[#0B1F4D]/5 text-[#0B1F4D]' : 'border-gray-200 text-gray-600 hover:border-[#0B1F4D]'}`}>
                <PackageSearch className="w-4 h-4" />{s.name}
              </button>
            ))}
          </div>
        )}

        {openSource && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <p className="text-sm font-bold text-[#0B1F4D]">{openSource.name}&apos;s catalogue</p>
              <div className="flex items-center gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                <button onClick={selectAll} className="text-xs font-bold text-[#0B1F4D] hover:underline">Select all</button>
              </div>
            </div>
            {msg && <p className="text-sm mb-3 text-green-600 font-semibold">{msg}</p>}
            {loading ? (
              <div className="py-10 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline" /> Loading…</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[26rem] overflow-y-auto">
                  {filtered.map((p) => (
                    <button key={p.id} type="button" disabled={p.imported} onClick={() => toggle(p.id)}
                      className={`text-left rounded-xl border p-2.5 transition-all ${p.imported ? 'opacity-50 cursor-default border-gray-100' : sel.has(p.id) ? 'border-[#0B1F4D] ring-1 ring-[#0B1F4D] bg-[#0B1F4D]/[0.03]' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2 flex items-center justify-center">
                        {p.image ? <Image src={p.image} alt="" fill className="object-contain p-1" sizes="120px" /> : <ImageOff className="w-5 h-5 text-gray-300" />}
                        {sel.has(p.id) && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#0B1F4D] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
                        {p.imported && <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded">Imported</span>}
                      </div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.brand ? `${p.brand} · ` : ''}{fmt(p.price_cents, p.currency_code)}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button disabled={sel.size === 0 || importing} onClick={runImport}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] disabled:opacity-50">
                    {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <>Import {sel.size} selected</>}
                  </button>
                  <span className="text-xs text-gray-400">Imported items become drafts in your catalogue, linked to the original.</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Share my catalogue */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <h2 className="font-bold text-[#0B1F4D] flex items-center gap-2 mb-1"><Share2 className="w-4 h-4" /> Share your catalogue</h2>
        <p className="text-xs text-gray-400 mb-4">Let a related supplier import and resell your products.</p>
        <div className="flex items-center gap-2 mb-4">
          <select value={grantTo} onChange={(e) => setGrantTo(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
            <option value="">Choose a supplier…</option>
            {grantable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button disabled={!grantTo || granting} onClick={grant} className="rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
            {granting ? '…' : 'Grant access'}
          </button>
        </div>
        {myTargets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {myTargets.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                {s.name}
                <button onClick={() => revoke(s.id)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
