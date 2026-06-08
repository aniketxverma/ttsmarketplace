'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UploadCloud, FileSpreadsheet, Check, Loader2, Trash2, ImageOff } from 'lucide-react'

type Category = { id: string; name: string; parent_id: string | null }
type Column = { index: number; header: string; samples: string[] }
type RawRow = { cells: Record<number, string>; images: string[]; _include: boolean }

const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'brand', label: 'Brand' },
  { key: 'price', label: 'Price' },
  { key: 'ean', label: 'Barcode / EAN' },
  { key: 'color', label: 'Color' },
  { key: 'units_per_carton', label: 'Qty / Carton' },
  { key: 'carton_dimensions', label: 'Carton size' },
  { key: 'weight', label: 'Weight (g)' },
  { key: 'description', label: 'Description' },
]
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CNY', 'AED', 'SAR', 'MAD']

const colLetter = (n: number) => { let s = ''; while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26) } return s }
const toNum = (s: string) => { const m = String(s ?? '').replace(/[, ]/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null }

export function ImportWizard({ categories }: { categories: Category[] }) {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sheets, setSheets] = useState<string[]>([])
  const [sheet, setSheet] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<RawRow[] | null>(null)
  const [map, setMap] = useState<Record<string, number>>({}) // field -> column index (0 = none)

  const [categoryId, setCategoryId] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [context, setContext] = useState<'wholesale' | 'retail' | 'both'>('wholesale')

  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: string[] } | null>(null)

  async function ensureUploaded(): Promise<string | null> {
    if (uploadedPath) return uploadedPath
    if (!file) return null
    setUploading(true); setError(null)
    try {
      const r = await fetch('/api/supplier/import/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setError(j.error ?? 'Could not start upload'); return null }
      const { error: upErr } = await supabase.storage.from('brand-assets')
        .uploadToSignedUrl(j.path, j.token, file, { contentType: file.type || 'application/octet-stream' })
      if (upErr) {
        const big = /exceed|maximum|size|413|payload/i.test(upErr.message)
        setError(big
          ? `Storage rejected the file — it's over your project's upload limit. Raise "Upload file size limit" in Supabase → Storage settings, then retry.`
          : `Upload failed: ${upErr.message}`)
        return null
      }
      setUploadedPath(j.path)
      return j.path
    } finally { setUploading(false) }
  }

  async function parse(withSheet?: string) {
    if (!file) return
    const path = await ensureUploaded()
    if (!path) return
    setParsing(true); setError(null)
    const res = await fetch('/api/supplier/import/parse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath: path, sheet: withSheet || undefined }),
    })
    const json = await res.json().catch(() => ({}))
    setParsing(false)
    if (!res.ok) { setError(json.error ?? 'Could not parse the file'); if (json.sheets) setSheets(json.sheets); return }
    setSheets(json.sheets ?? [])
    setSheet(json.sheet ?? '')
    setColumns(json.columns ?? [])
    setMap(json.autoMap ?? {})
    setRows((json.rows as Omit<RawRow, '_include'>[]).map((r) => ({ ...r, _include: true })))
  }

  async function cleanup() {
    if (!uploadedPath) return
    try { await fetch('/api/supplier/import/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storagePath: uploadedPath }) }) } catch {}
  }
  function reset() { cleanup(); setUploadedPath(null); setFile(null); setRows(null); setColumns([]); setSheets([]); setSheet(''); setError(null) }

  const cell = (r: RawRow, field: string) => { const c = map[field]; return c ? (r.cells[c] ?? '') : '' }
  const included = rows?.filter((r) => r._include) ?? []
  const withImages = included.filter((r) => r.images.length > 0).length
  const nameMapped = !!map.name

  function update(i: number, patch: Partial<RawRow>) { setRows((rs) => rs!.map((r, idx) => (idx === i ? { ...r, ...patch } : r))) }

  async function runImport() {
    if (!categoryId) { setError('Choose a category for this batch first'); return }
    if (!nameMapped) { setError('Map the Product Name column first'); return }
    setImporting(true); setError(null)
    const products = included
      .map((r) => ({
        name: cell(r, 'name').trim(),
        brand: cell(r, 'brand') || null,
        price: toNum(cell(r, 'price')),
        ean: cell(r, 'ean') || null,
        color: cell(r, 'color') || null,
        units_per_carton: map.units_per_carton ? Math.round(toNum(cell(r, 'units_per_carton')) || 0) || null : null,
        carton_dimensions: cell(r, 'carton_dimensions') || null,
        weight_grams: map.weight ? Math.round(toNum(cell(r, 'weight')) || 0) || null : null,
        description: cell(r, 'description') || null,
        images: r.images,
      }))
      .filter((p) => p.name)
    const res = await fetch('/api/supplier/import/commit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, categoryId, currency, marketplaceContext: context, catalogueName: file?.name ?? 'Excel import' }),
    })
    const json = await res.json().catch(() => ({}))
    setImporting(false)
    if (!res.ok) { setError(json.error ?? 'Import failed'); return }
    setResult(json)
  }

  // ── Success ──
  if (result) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check className="w-7 h-7 text-green-600" /></div>
        <p className="text-xl font-extrabold text-[#0B1F4D]">Imported {result.created} products</p>
        <p className="text-sm text-gray-500 mt-1">Saved as drafts — review prices &amp; publish when ready.</p>
        {result.failed.length > 0 && <p className="text-xs text-amber-600 mt-2">{result.failed.length} row(s) skipped.</p>}
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/supplier/products" className="rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e]">Go to my products</Link>
          <button onClick={() => { setResult(null); if (sheets.length <= 1) reset() }} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">Import {sheets.length > 1 ? 'another sheet' : 'another file'}</button>
        </div>
      </div>
    )
  }

  const busy = uploading || parsing
  const colOption = (c: Column) => `${colLetter(c.index)} · ${c.header || '(no header)'}${c.samples[0] ? ` — ${c.samples[0].slice(0, 18)}` : ''}`

  return (
    <div className="space-y-5">
      {/* Step 1 — upload */}
      {!rows && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#0B1F4D] transition-colors py-12 cursor-pointer">
            <UploadCloud className="w-10 h-10 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-[#0B1F4D]">{file ? file.name : 'Click to choose an .xlsx file'}</p>
              <p className="text-xs text-gray-400">Any supplier price list — you&apos;ll map the columns next</p>
            </div>
            <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); setSheets([]); setUploadedPath(null) }} />
          </label>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button type="button" disabled={!file || busy} onClick={() => parse()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-50">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading…</> : <><FileSpreadsheet className="w-4 h-4" /> Upload &amp; read</>}
          </button>
        </div>
      )}

      {/* Step 2 — map + preview */}
      {rows && (
        <>
          {/* Batch settings */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {sheets.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Sheet</label>
                <select value={sheet} disabled={busy} onChange={(e) => { setSheet(e.target.value); parse(e.target.value) }} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                  {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                <option value="">Choose category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? '— ' : ''}{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
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

          {/* Column mapping */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <p className="text-sm font-bold text-[#0B1F4D] mb-1">Map your columns</p>
            <p className="text-xs text-gray-400 mb-4">We auto-detected these — adjust any that are wrong. Only <strong>Product Name</strong> is required.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                  <select value={map[f.key] ?? 0} onChange={(e) => setMap((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                    className={`w-full rounded-lg border px-2.5 py-2 text-xs bg-white ${f.required && !map[f.key] ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'}`}>
                    <option value={0}>— none —</option>
                    {columns.map((c) => <option key={c.index} value={c.index}>{colOption(c)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-500">{included.length} rows · {withImages} with photos {!nameMapped && <span className="text-red-600 font-semibold">· map Product Name to continue</span>}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Preview */}
          <div className="relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {parsing && <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#0B1F4D]"><Loader2 className="w-4 h-4 animate-spin" /> Reading…</span></div>}
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2.5 w-8"></th>
                    <th className="px-3 py-2.5 w-14">Photo</th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5 w-28">Price ({currency})</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t border-gray-50 ${!r._include ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-2"><input type="checkbox" checked={r._include} onChange={(e) => update(i, { _include: e.target.checked })} className="w-4 h-4 accent-[#0B1F4D]" /></td>
                      <td className="px-3 py-2">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative flex items-center justify-center">
                          {r.images[0] ? <Image src={r.images[0]} alt="" fill className="object-contain p-0.5" sizes="40px" /> : <ImageOff className="w-4 h-4 text-gray-300" />}
                          {r.images.length > 1 && <span className="absolute bottom-0 right-0 text-[9px] font-bold bg-[#0B1F4D] text-white px-1 rounded-tl">{r.images.length}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[20rem]">{cell(r, 'name') || <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2 text-gray-600">{cell(r, 'price') || '—'}</td>
                      <td className="px-3 py-2"><button type="button" onClick={() => update(i, { _include: false })} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" disabled={importing || busy || included.length === 0 || !nameMapped} onClick={runImport} className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-7 py-3 text-sm font-extrabold hover:bg-[#fbb93a] disabled:opacity-50">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <>Import {included.length} products</>}
            </button>
            <button type="button" onClick={reset} className="text-sm font-bold text-gray-500 hover:text-gray-700">Start over</button>
          </div>
        </>
      )}
    </div>
  )
}
