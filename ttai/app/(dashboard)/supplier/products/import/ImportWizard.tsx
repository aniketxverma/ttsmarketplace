'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileSpreadsheet, Check, Loader2, Trash2, ImageOff } from 'lucide-react'

type Category = { id: string; name: string; parent_id: string | null }

interface Row {
  name: string
  price_usd: number | null
  price_rmb: number | null
  ean: string | null
  color: string | null
  units_per_carton: number | null
  carton_dimensions: string | null
  weight_grams: number | null
  description: string | null
  images: string[]
  _include: boolean
}

export function ImportWizard({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<string[]>([])
  const [sheet, setSheet] = useState<string>('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [detected, setDetected] = useState<string[]>([])

  const [categoryId, setCategoryId] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'RMB'>('USD')
  const [context, setContext] = useState<'wholesale' | 'retail' | 'both'>('wholesale')

  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: string[] } | null>(null)

  async function parse(withSheet?: string) {
    if (!file) return
    const mb = file.size / (1024 * 1024)
    if (mb > 20) {
      setError(`This file is ${Math.round(mb)} MB — too large to upload through the browser (it likely has many full-resolution embedded photos). Import one category sheet at a time, compress the images first, or ask us to bulk-import it for you.`)
      return
    }
    setParsing(true); setError(null)
    const fd = new FormData()
    fd.append('file', file)
    if (withSheet) fd.append('sheet', withSheet)
    const res = await fetch('/api/supplier/import/parse', { method: 'POST', body: fd })
    const json = await res.json().catch(() => ({}))
    setParsing(false)
    if (!res.ok) {
      setError(json.error ?? 'Could not parse the file')
      if (json.sheets) setSheets(json.sheets)
      return
    }
    setSheets(json.sheets ?? [])
    setSheet(json.sheet ?? '')
    setDetected(json.detected ?? [])
    setRows((json.rows as Row[]).map((r) => ({ ...r, _include: true })))
  }

  const included = rows?.filter((r) => r._include) ?? []
  const withImages = included.filter((r) => r.images.length > 0).length

  function update(i: number, patch: Partial<Row>) {
    setRows((rs) => rs!.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  async function runImport() {
    if (!categoryId) { setError('Choose a category for this batch first'); return }
    setImporting(true); setError(null)
    const res = await fetch('/api/supplier/import/commit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: included, categoryId, currency, marketplaceContext: context }),
    })
    const json = await res.json().catch(() => ({}))
    setImporting(false)
    if (!res.ok) { setError(json.error ?? 'Import failed'); return }
    setResult(json)
  }

  const price = (r: Row) => (currency === 'RMB' ? r.price_rmb : r.price_usd)

  // ── Success ──
  if (result) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-xl font-extrabold text-[#0B1F4D]">Imported {result.created} products</p>
        <p className="text-sm text-gray-500 mt-1">They&apos;re saved as drafts — review prices &amp; publish when ready.</p>
        {result.failed.length > 0 && (
          <p className="text-xs text-amber-600 mt-2">{result.failed.length} row(s) skipped: {result.failed.slice(0, 5).join(', ')}{result.failed.length > 5 ? '…' : ''}</p>
        )}
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/supplier/products" className="rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e]">Go to my products</Link>
          <button onClick={() => { setResult(null); setRows(null); setFile(null) }} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">Import another file</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — upload */}
      {!rows && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#0B1F4D] transition-colors py-12 cursor-pointer">
            <UploadCloud className="w-10 h-10 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-[#0B1F4D]">{file ? file.name : 'Click to choose an .xlsx file'}</p>
              <p className="text-xs text-gray-400">Supplier price list with embedded product photos</p>
            </div>
            <input type="file" accept=".xlsx" className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); setSheets([]) }} />
          </label>

          {sheets.length > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Sheet</span>
              <select value={sheet} onChange={(e) => setSheet(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option value="">First sheet</option>
                {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button type="button" disabled={!file || parsing} onClick={() => parse(sheet || undefined)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
            {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading…</> : <><FileSpreadsheet className="w-4 h-4" /> Read file</>}
          </button>
        </div>
      )}

      {/* Step 2 — preview & import */}
      {rows && (
        <>
          {/* Batch settings */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                <option value="">Choose category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? '— ' : ''}{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Price column</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'RMB')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                <option value="USD">EXW price (USD)</option>
                <option value="RMB">EXW price (RMB → CNY)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Sell in</label>
              <select value={context} onChange={(e) => setContext(e.target.value as any)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                <option value="wholesale">B2B (wholesale)</option>
                <option value="retail">Online shop (retail)</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              Detected: <span className="font-semibold text-[#0B1F4D]">{detected.join(', ') || 'name'}</span> ·
              {' '}{included.length} selected · {withImages} with photos
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Preview table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="max-h-[28rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2.5 w-8"></th>
                    <th className="px-3 py-2.5 w-14">Photo</th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5 w-28">Price ({currency})</th>
                    <th className="px-3 py-2.5 w-20">Qty/Ctn</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t border-gray-50 ${!r._include ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={r._include} onChange={(e) => update(i, { _include: e.target.checked })} className="w-4 h-4 accent-[#0B1F4D]" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative flex items-center justify-center">
                          {r.images[0]
                            ? <Image src={r.images[0]} alt="" fill className="object-contain p-0.5" sizes="40px" />
                            : <ImageOff className="w-4 h-4 text-gray-300" />}
                          {r.images.length > 1 && <span className="absolute bottom-0 right-0 text-[9px] font-bold bg-[#0B1F4D] text-white px-1 rounded-tl">{r.images.length}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input value={r.name} onChange={(e) => update(i, { name: e.target.value })}
                          className="w-full bg-transparent text-gray-800 font-medium focus:outline-none focus:bg-gray-50 rounded px-1 py-0.5" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={price(r) ?? ''} onChange={(e) => update(i, currency === 'RMB' ? { price_rmb: parseFloat(e.target.value) || null } : { price_usd: parseFloat(e.target.value) || null })}
                          className="w-24 bg-transparent text-gray-700 focus:outline-none focus:bg-gray-50 rounded px-1 py-0.5" />
                      </td>
                      <td className="px-3 py-2 text-gray-500">{r.units_per_carton ?? '—'}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => update(i, { _include: false })} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" disabled={importing || included.length === 0} onClick={runImport}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-7 py-3 text-sm font-extrabold hover:bg-[#fbb93a] disabled:opacity-50">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <>Import {included.length} products</>}
            </button>
            <button type="button" onClick={() => { setRows(null); setError(null) }} className="text-sm font-bold text-gray-500 hover:text-gray-700">Start over</button>
          </div>
        </>
      )}
    </div>
  )
}
