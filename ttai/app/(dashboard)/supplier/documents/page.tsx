'use client'

import { useState, useEffect, useRef } from 'react'
import { useT } from '@/lib/i18n/client'
import { createClient } from '@/lib/supabase/client'
import { FileSpreadsheet, FileText, FileImage, File, Download, Trash2, Upload, Eye, EyeOff, Loader2 } from 'lucide-react'

interface Doc {
  id: string
  doc_type: string
  file_url: string
  uploaded_at: string
  title?: string | null
  file_name?: string | null
  file_size_bytes?: number | null
  is_public?: boolean | null
}

const DOC_TYPES = [
  { value: 'price_list',        label: 'Price List' },
  { value: 'catalog',           label: 'Product Catalog' },
  { value: 'brochure',          label: 'Brochure' },
  { value: 'tax_certificate',   label: 'Tax Certificate' },
  { value: 'business_license',  label: 'Business License' },
  { value: 'vat_certificate',   label: 'VAT Certificate' },
  { value: 'bank_proof',        label: 'Bank Proof' },
  { value: 'other',             label: 'Other' },
]

/** Verification doc types default to private; catalog-type docs default to public. */
const PRIVATE_BY_DEFAULT = new Set(['tax_certificate', 'business_license', 'vat_certificate', 'bank_proof'])

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' }
  if (ext === 'pdf') return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { Icon: FileImage, color: 'text-blue-600', bg: 'bg-blue-50' }
  if (['doc', 'docx'].includes(ext)) return { Icon: FileText, color: 'text-blue-700', bg: 'bg-blue-50' }
  return { Icon: File, color: 'text-gray-500', bg: 'bg-gray-100' }
}

function fmtSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 2 : 0)} ${units[i]}`
}

export default function SupplierDocumentsPage() {
  const t = useT()
  const [docs, setDocs] = useState<Doc[]>([])
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('price_list')
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
      if (!supplier) return
      setSupplierId(supplier.id)
      const { data } = await supabase.from('supplier_documents').select('*').eq('supplier_id', supplier.id).order('sort_order', { ascending: true }).order('uploaded_at', { ascending: false })
      setDocs((data ?? []) as Doc[])
    })
  }, [])

  // Keep the public toggle in sync with the chosen type's sensible default.
  useEffect(() => { setIsPublic(!PRIVATE_BY_DEFAULT.has(docType)) }, [docType])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !fileRef.current?.files?.[0]) return
    setUploading(true)

    const file = fileRef.current.files[0]
    const supabase = createClient()
    const path = `documents/${supplierId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('brand-assets').upload(path, file)
    if (uploadError) { alert(uploadError.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)

    const row: Record<string, unknown> = {
      supplier_id: supplierId,
      doc_type: docType,
      file_url: urlData.publicUrl,
      title: title.trim() || DOC_TYPES.find((d) => d.value === docType)?.label || file.name,
      file_name: file.name,
      file_size_bytes: file.size,
      is_public: isPublic,
    }

    // Insert with the new columns; fall back to the legacy shape if the migration
    // hasn't been applied yet.
    let inserted: Doc | null = null
    const { data, error } = await supabase.from('supplier_documents').insert(row as any).select().single()
    if (error && /column|does not exist/i.test(error.message)) {
      const { data: legacy } = await supabase.from('supplier_documents')
        .insert({ supplier_id: supplierId, doc_type: docType, file_url: urlData.publicUrl } as any)
        .select().single()
      inserted = legacy as Doc
    } else {
      inserted = data as Doc
    }

    if (inserted) setDocs((prev) => [inserted!, ...prev])
    if (fileRef.current) fileRef.current.value = ''
    setTitle('')
    setUploading(false)
  }

  async function togglePublic(doc: Doc) {
    const supabase = createClient()
    const next = !doc.is_public
    setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, is_public: next } : d))
    await supabase.from('supplier_documents').update({ is_public: next } as any).eq('id', doc.id)
  }

  async function remove(doc: Doc) {
    if (!confirm('Delete this document?')) return
    const supabase = createClient()
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    await supabase.from('supplier_documents').delete().eq('id', doc.id)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Documents &amp; Catalogs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Upload Excel price lists, PDF catalogs and brochures. Public files appear on your storefront for buyers to download.
        </p>
      </div>

      <form onSubmit={handleUpload} className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4" /> {t("Upload File")}</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("Type")}</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("Display title")} <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t("e.g. Price List 2026")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t("File")} <span className="text-muted-foreground font-normal">(PDF, Excel, Word, image — max 25MB)</span></label>
          <input ref={fileRef} type="file" accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp" required className="w-full text-sm" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-input" />
          <span>{t("Show on my public storefront (buyers can download)")}</span>
        </label>

        <button type="submit" disabled={uploading || !supplierId} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("Uploading…")}</> : 'Upload'}
        </button>
      </form>

      <div className="space-y-2.5">
        {docs.map((doc) => {
          const { Icon, color, bg } = fileIcon(doc.file_name ?? doc.file_url)
          const label = doc.title || DOC_TYPES.find((d) => d.value === doc.doc_type)?.label || doc.doc_type.replace(/_/g, ' ')
          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className={`w-11 h-11 flex-shrink-0 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold capitalize truncate">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {[fmtSize(doc.file_size_bytes), new Date(doc.uploaded_at).toLocaleDateString()].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${doc.is_public ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {doc.is_public ? 'Public' : 'Private'}
              </span>
              <button onClick={() => togglePublic(doc)} title={doc.is_public ? 'Make private' : 'Make public'}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                {doc.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="Download"
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => remove(doc)} title="Delete"
                className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
        {!docs.length && <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">{t("No documents uploaded yet")}</p>}
      </div>
    </div>
  )
}
