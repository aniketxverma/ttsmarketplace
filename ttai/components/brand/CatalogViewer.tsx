'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Search, Download, Loader2, Table2, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25
const CAT_RE = /^(category|categoría|categoria|familia|family|cat|tipo|type|section)$/i

// In-browser Excel/CSV catalogue viewer: sheet tabs, auto category tabs, search,
// pagination and category/filtered downloads. Parses client-side with SheetJS.
export function CatalogViewer({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
  const [wb, setWb] = useState<any>(null)
  const [xlsx, setXlsx] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState(0)
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const XLSX = await import('xlsx')
        const res = await fetch(fileUrl)
        const buf = await res.arrayBuffer()
        const book = XLSX.read(buf, { type: 'array' })
        if (alive) { setXlsx(XLSX); setWb(book) }
      } catch (e: any) { if (alive) setError('Could not read this file.') }
    })()
    return () => { alive = false }
  }, [fileUrl])

  const sheetNames: string[] = wb?.SheetNames ?? []
  const grid: string[][] = useMemo(() => {
    if (!wb || !xlsx) return []
    const ws = wb.Sheets[sheetNames[sheet]]
    return xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
  }, [wb, xlsx, sheet, sheetNames])

  const headers = grid[0]?.map((h) => String(h ?? '')) ?? []
  const rows = grid.slice(1)
  const catIdx = headers.findIndex((h) => CAT_RE.test(h.trim()))
  const categories = useMemo(() => {
    if (catIdx < 0) return [] as string[]
    return Array.from(new Set(rows.map((r) => String(r[catIdx] ?? '').trim()).filter(Boolean))).sort()
  }, [rows, catIdx])

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    return rows.filter((r) =>
      (!cat || String(r[catIdx] ?? '').trim() === cat) &&
      (!term || r.some((c) => String(c ?? '').toLowerCase().includes(term))))
  }, [rows, cat, catIdx, q])

  useEffect(() => { setPage(0) }, [cat, q, sheet])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const view = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const downloadFiltered = (label: string) => {
    if (!xlsx) return
    const aoa = [headers, ...filtered]
    const ws = xlsx.utils.aoa_to_sheet(aoa)
    const out = xlsx.utils.book_new(); xlsx.utils.book_append_sheet(out, ws, 'Catalog')
    xlsx.writeFile(out, `${fileName.replace(/\.[^.]+$/, '')}-${label}.xlsx`)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-6xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] text-white flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Table2 className="w-5 h-5 text-[#F5A623] flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-extrabold text-sm truncate">{fileName}</p>
              <p className="text-[11px] text-white/60">{rows.length} products{categories.length ? ` · ${categories.length} categories` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU, brand…" className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B1F4D]/50" />
          </div>
          <a href={fileUrl} download className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-3 py-2 text-xs font-bold hover:bg-[#162d6e]"><Download className="w-4 h-4" /> Full Excel</a>
          <button onClick={() => downloadFiltered(cat || 'filtered')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-[#0B1F4D]"><Download className="w-4 h-4" /> {cat ? 'Category' : 'Filtered'}</button>
        </div>

        {/* Sheet tabs */}
        {sheetNames.length > 1 && (
          <div className="flex gap-1 px-4 pt-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
            {sheetNames.map((s, i) => (
              <button key={s} onClick={() => { setSheet(i); setCat('') }} className={`px-3 py-1.5 rounded-t-lg text-xs font-bold whitespace-nowrap ${i === sheet ? 'bg-gray-100 text-[#0B1F4D]' : 'text-gray-400 hover:text-gray-600'}`}>{s}</button>
            ))}
          </div>
        )}

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto flex-shrink-0 border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setCat('')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${!cat ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({rows.length})</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cat === c ? 'bg-[#F5A623] text-[#0B1F4D]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          {error ? (
            <div className="p-10 text-center text-gray-400">{error}</div>
          ) : !wb ? (
            <div className="p-10 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading catalogue…</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>{headers.map((h, i) => <th key={i} className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200 whitespace-nowrap">{h || `Col ${i + 1}`}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {view.map((r, ri) => (
                  <tr key={ri} className="hover:bg-gray-50/70">
                    {headers.map((_, ci) => <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[280px] truncate">{String(r[ci] ?? '')}</td>)}
                  </tr>
                ))}
                {view.length === 0 && <tr><td colSpan={headers.length || 1} className="px-3 py-10 text-center text-gray-400">No rows match.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 flex-shrink-0 text-xs text-gray-500">
          <span>{filtered.length} results{cat ? ` in ${cat}` : ''}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-[#0B1F4D]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-bold">Page {page + 1} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-[#0B1F4D]"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
