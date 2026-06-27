'use client'

import { useMemo, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Layers, X, Tag } from 'lucide-react'

type Item = { id: string; name: string; brand: string | null; line: string | null; category: string | null; thumb: string | null }

export function FamilyOrganizer({ items: initial }: { items: Item[] }) {
  const t = useT()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>(initial)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [line, setLine] = useState('')
  const [busy, setBusy] = useState<false | 'apply' | 'clear'>(false)
  const [msg, setMsg] = useState<string | null>(null)

  const brands = useMemo(() => Array.from(new Set(items.map((i) => i.brand).filter(Boolean))) as string[], [items])
  const existingLines = useMemo(() => Array.from(new Set(items.map((i) => i.line).filter(Boolean))) as string[], [items])

  // Group rows by their current family (null = ungrouped), ungrouped first.
  const groups = useMemo(() => {
    const m = new Map<string, Item[]>()
    for (const i of items) { const k = i.line ?? ''; if (!m.has(k)) m.set(k, []); m.get(k)!.push(i) }
    return Array.from(m.entries()).sort((a, b) => (a[0] === '' ? -1 : b[0] === '' ? 1 : a[0].localeCompare(b[0])))
  }, [items])

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectBrand = (brand: string) => setSel((s) => {
    const ids = items.filter((i) => i.brand === brand).map((i) => i.id)
    const allOn = ids.every((id) => s.has(id))
    const n = new Set(s); ids.forEach((id) => allOn ? n.delete(id) : n.add(id)); return n
  })

  async function apply(targetLine: string | null) {
    if (sel.size === 0) return
    setBusy(targetLine === null ? 'clear' : 'apply'); setMsg(null)
    try {
      const res = await fetch('/api/supplier/products/bulk-line', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(sel), line: targetLine }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setItems((arr) => arr.map((i) => sel.has(i.id) ? { ...i, line: json.line ?? null } : i))
      setMsg(`${json.updated} product${json.updated !== 1 ? 's' : ''} ${targetLine ? `moved to “${json.line}”` : 'removed from their family'}.`)
      setSel(new Set()); if (targetLine === null) setLine('')
      router.refresh()
    } catch (e: any) { setMsg(e.message || 'Something went wrong') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="sticky top-16 z-10 rounded-2xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t("Family / product line")}</label>
            <input list="line-options" value={line} onChange={(e) => setLine(e.target.value)}
              placeholder={t("e.g. iPhone, Samsung, Xiaomi")}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#0B1F4D]" />
            <datalist id="line-options">{existingLines.map((l) => <option key={l} value={l} />)}</datalist>
          </div>
          <button onClick={() => apply(line.trim() || null)} disabled={!line.trim() || sel.size === 0 || !!busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-50">
            {busy === 'apply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {t("Assign to")} {sel.size || ''} {t("selected")}
          </button>
          <button onClick={() => apply(null)} disabled={sel.size === 0 || !!busy}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 text-gray-600 px-4 py-2.5 text-sm font-bold hover:border-gray-300 transition-colors disabled:opacity-50">
            {busy === 'clear' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            {t("Remove from family")}
          </button>
        </div>

        {/* Quick-select by brand */}
        {brands.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">{t("Quick select:")}</span>
            {brands.map((b) => {
              const ids = items.filter((i) => i.brand === b).map((i) => i.id)
              const allOn = ids.length > 0 && ids.every((id) => sel.has(id))
              return (
                <button key={b} onClick={() => selectBrand(b)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors ${allOn ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1F4D]'}`}>
                  <Tag className="w-3 h-3" />{b} ({ids.length})
                </button>
              )
            })}
            {sel.size > 0 && (
              <button onClick={() => setSel(new Set())} className="text-[11px] font-bold text-red-600 hover:underline ml-1">{t("Clear (")}{sel.size})</button>
            )}
          </div>
        )}
        {msg && <p className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">{msg}</p>}
      </div>

      {/* Product list, grouped by current family */}
      <div className="space-y-5">
        {groups.map(([key, rows]) => (
          <div key={key || 'ungrouped'}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-extrabold text-[#0B1F4D]">{key || 'Ungrouped'}</h3>
              <span className="text-xs text-gray-400">{rows.length}</span>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 overflow-hidden">
              {rows.map((i) => {
                const on = sel.has(i.id)
                return (
                  <label key={i.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${on ? 'bg-[#0B1F4D]/[0.04]' : 'hover:bg-gray-50/60'}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(i.id)} className="w-4 h-4 accent-[#0B1F4D] flex-shrink-0" />
                    <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {i.thumb ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={i.thumb} alt="" className="w-full h-full object-cover" />) : <span className="text-gray-300 text-sm">📦</span>}
                    </div>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-800 truncate">{i.name}</span>
                      <span className="block text-[11px] text-gray-400 truncate">{i.category ?? '—'}</span>
                    </span>
                    {i.brand && <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0B1F4D] bg-[#0B1F4D]/5 px-1.5 py-0.5 rounded flex-shrink-0">{i.brand}</span>}
                    {i.line && <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded flex-shrink-0"><Check className="w-3 h-3" />{i.line}</span>}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
