'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const DOC_TYPES = ['tax_certificate', 'business_license', 'vat_certificate', 'bank_proof', 'other']

export default function SupplierDocumentsPage() {
  const [docs, setDocs] = useState<{ id: string; doc_type: string; file_url: string; uploaded_at: string }[]>([])
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('tax_certificate')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
      if (!supplier) return
      setSupplierId(supplier.id)
      const { data } = await supabase.from('supplier_documents').select('*').eq('supplier_id', supplier.id).order('uploaded_at', { ascending: false })
      setDocs(data ?? [])
    })
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !fileRef.current?.files?.[0]) return
    setUploading(true)

    const file = fileRef.current.files[0]
    const supabase = createClient()
    const path = `${supplierId}/${Date.now()}-${file.name}`

    const { data: upload, error: uploadError } = await supabase.storage
      .from('supplier-documents')
      .upload(path, file)

    if (uploadError) { alert(uploadError.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('supplier-documents').getPublicUrl(path)

    const { data: doc } = await supabase
      .from('supplier_documents')
      .insert({ supplier_id: supplierId, doc_type: docType, file_url: urlData.publicUrl })
      .select()
      .single()

    if (doc) setDocs((prev) => [doc, ...prev])
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Upload verification documents to expedite approval</p>
      </div>

      <form onSubmit={handleUpload} className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Upload Document</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Document Type</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">File (PDF, PNG, JPG — max 10MB)</label>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" required className="w-full text-sm" />
        </div>
        <button type="submit" disabled={uploading || !supplierId} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <div className="space-y-3">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
              <p className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
            </div>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              View
            </a>
          </div>
        ))}
        {!docs.length && <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet</p>}
      </div>
    </div>
  )
}
