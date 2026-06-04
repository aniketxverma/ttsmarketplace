'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Loader2, X } from 'lucide-react'

/**
 * Upload an image to the `brand-assets` bucket via /api/upload and return its
 * public URL through `onChange`. Used for brand logo, banner, etc.
 */
export function ImageUpload({
  value, onChange, folder, aspect = 'square', label,
}: {
  value: string | null
  onChange: (url: string) => void
  folder: 'logos' | 'banners' | 'gallery' | 'products' | 'misc'
  aspect?: 'square' | 'wide'
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setError(json.error ?? 'Upload failed')
      else onChange(json.url)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const box = aspect === 'wide' ? 'aspect-[4/1]' : 'w-28 h-28'

  return (
    <div className="space-y-2">
      <div className={`relative ${box} rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden group`}>
        {value ? (
          <>
            <Image src={value} alt={label ?? 'image'} fill className="object-cover" sizes="400px" unoptimized />
            <button type="button" onClick={() => onChange('')}
              className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#0B1F4D] hover:bg-blue-50/40 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            <span className="text-[11px] font-semibold">{uploading ? 'Uploading…' : 'Upload image'}</span>
          </button>
        )}
        {value && (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold gap-1.5">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Replace</>}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
