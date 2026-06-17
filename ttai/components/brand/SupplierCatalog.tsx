'use client'

import { useState } from 'react'
import { FileSpreadsheet, Download, Eye, Calendar } from 'lucide-react'
import { CatalogViewer } from './CatalogViewer'

type Doc = { id: string; file_url: string; file_name?: string | null; title?: string | null; doc_type?: string; uploaded_at?: string; file_size_bytes?: number | null }

const isExcel = (d: Doc) => {
  const n = (d.file_name ?? d.file_url ?? '').toLowerCase()
  return /\.(xlsx|xls|csv)(\?|$)/.test(n) || ['catalog', 'price_list'].includes(d.doc_type ?? '')
}
const fmtSize = (b?: number | null) => (b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '')
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

// "Supplier Catalog" — shows the supplier's uploaded Excel with download + an
// in-browser preview (category tabs, search, pagination).
export function SupplierCatalog({ documents }: { documents: Doc[] }) {
  const [open, setOpen] = useState<Doc | null>(null)
  const excels = documents.filter(isExcel)
  if (!excels.length) return null

  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-extrabold text-[#0B1F4D]">Supplier Catalog</h2>
      </div>
      <div className="space-y-3">
        {excels.map((d) => {
          const name = d.file_name ?? d.title ?? 'Catalogue.xlsx'
          return (
            <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><FileSpreadsheet className="w-6 h-6 text-green-600" /></div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
                  <p className="flex items-center gap-2 text-[11px] text-gray-400">
                    {d.uploaded_at && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(d.uploaded_at)}</span>}
                    {fmtSize(d.file_size_bytes) && <span>· {fmtSize(d.file_size_bytes)}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setOpen(d)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-4 py-2 text-xs font-bold hover:bg-[#162d6e] transition-colors"><Eye className="w-4 h-4" /> Preview</button>
                <a href={d.file_url} download className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:border-[#0B1F4D] transition-colors"><Download className="w-4 h-4" /> Download</a>
              </div>
            </div>
          )
        })}
      </div>
      {open && <CatalogViewer fileUrl={open.file_url} fileName={open.file_name ?? open.title ?? 'Catalogue'} onClose={() => setOpen(null)} />}
    </section>
  )
}
