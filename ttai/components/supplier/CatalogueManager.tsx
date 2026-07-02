'use client'

import { useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { createClient } from '@/lib/supabase/client'
import { FileSpreadsheet, FileText, FileImage, File as FileIcon, Download, Trash2, Upload, Loader2 } from 'lucide-react'

interface Doc { id: string; doc_type: string; file_url: string; title?: string | null; file_name?: string | null; file_size_bytes?: number | null; is_public?: boolean | null; uploaded_at: string }

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' }
  if (ext === 'pdf') return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { Icon: FileImage, color: 'text-blue-600', bg: 'bg-blue-50' }
  if (['doc', 'docx'].includes(ext)) return { Icon: FileText, color: 'text-blue-700', bg: 'bg-blue-50' }
  return { Icon: FileIcon, color: 'text-gray-500', bg: 'bg-gray-100' }
}
function fmtSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ''
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0, n = bytes
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`
}

const INPUT = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/15'

/**
 * Upload catalogues / price lists (PDF, Excel…) that appear publicly on the
 * supplier's brand page. Writes to supplier_documents with is_public = true.
 */
export function CatalogueManager({ supplierId }: { supplierId: string }) {
  const t = useT()
  const supabase = createClient()
  const [docs, setDocs] = useState<Doc[]>([])
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('catalog')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('supplier_documents').select('*').eq('supplier_id', supplierId).order('uploaded_at', { ascending: false })
      .then(({ data }) => setDocs(((data ?? []) as Doc[]).filter((d) => d.is_public !== false)))
  }, [supplierId, supabase])

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!fileRef.current?.files?.[0]) return
    setUploading(true)
    const file = fileRef.current.files[0]
    // Upload through the server endpoint (service-role → brand-assets); the
    // browser client can't write to the bucket directly (storage RLS).
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'docs')
    const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
    const upJson = await upRes.json().catch(() => ({}))
    if (!upRes.ok || !upJson.url) { alert(upJson.error || 'Upload failed'); setUploading(false); return }
    const fileUrl = upJson.url as string

    const row: Record<string, unknown> = {
      supplier_id: supplierId, doc_type: docType, file_url: fileUrl,
      title: title.trim() || (docType === 'price_list' ? 'Price List' : docType === 'brochure' ? 'Brochure' : 'Catalogue'),
      file_name: file.name, file_size_bytes: file.size, is_public: true,
    }
    let inserted: Doc | null = null
    const { data, error } = await supabase.from('supplier_documents').insert(row as any).select().single()
    if (error && /column|does not exist/i.test(error.message)) {
      const { data: legacy } = await supabase.from('supplier_documents')
        .insert({ supplier_id: supplierId, doc_type: docType, file_url: fileUrl } as any).select().single()
      inserted = legacy as Doc
    } else inserted = data as Doc
    if (inserted) setDocs((p) => [inserted!, ...p])
    if (fileRef.current) fileRef.current.value = ''
    setTitle(''); setUploading(false)
  }

  async function remove(doc: Doc) {
    if (!confirm('Remove this file from your public profile?')) return
    setDocs((p) => p.filter((d) => d.id !== doc.id))
    await supabase.from('supplier_documents').delete().eq('id', doc.id)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-[#0B1F4D]">Catalogues &amp; Price Lists</h3>
        <p className="text-sm text-gray-500 mt-0.5">{t("Upload PDF / Excel files. They appear in the")} <strong>{t("Supplier Documents")}</strong> {t("panel on your public profile for buyers to download.")}</p>
      </div>

      <form onSubmit={upload} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t("Type")}</label>
            <select className={INPUT} value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="catalog">{t("Product Catalogue")}</option>
              <option value="price_list">{t("Price List")}</option>
              <option value="brochure">{t("Brochure")}</option>
              <option value="other">{t("Other")}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t("Title (optional)")}</label>
            <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("e.g. Catalogue 2026")} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t("File (PDF, Excel, Word, image — max 25MB)")}</label>
          <input ref={fileRef} type="file" accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp" required className="w-full text-sm" />
        </div>
        <button type="submit" disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-4 py-2 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-50">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("Uploading…")}</> : <><Upload className="w-4 h-4" /> {t("Upload to profile")}</>}
        </button>
      </form>

      <div className="space-y-2">
        {docs.map((doc) => {
          const { Icon, color, bg } = fileIcon(doc.file_name ?? doc.file_url)
          const label = doc.title || doc.doc_type.replace(/_/g, ' ')
          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <div className={`w-10 h-10 flex-shrink-0 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold capitalize truncate">{label}</p>
                <p className="text-xs text-gray-400">{[fmtSize(doc.file_size_bytes), new Date(doc.uploaded_at).toLocaleDateString()].filter(Boolean).join(' · ')}</p>
              </div>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Download className="w-4 h-4" /></a>
              <button onClick={() => remove(doc)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          )
        })}
        {!docs.length && <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">{t("No catalogues uploaded yet")}</p>}
      </div>
    </div>
  )
}
