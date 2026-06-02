'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export function AvatarUploader({
  userId,
  currentUrl,
  name,
}: {
  userId: string
  currentUrl: string | null
  name: string
}) {
  const [preview, setPreview]     = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router  = useRouter()
  const initial = name[0]?.toUpperCase() ?? '?'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB'); return }

    setError(null)
    setUploading(true)

    // Instant local preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res  = await fetch('/api/account/avatar', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Upload failed')
      } else {
        setPreview(json.url)
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden relative block
          focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:ring-offset-2"
      >
        {preview ? (
          <Image
            src={preview}
            alt={name}
            width={64}
            height={64}
            className="object-cover w-full h-full"
            unoptimized={preview.startsWith('data:')}
          />
        ) : (
          <div className="w-full h-full bg-[#0B1F4D] flex items-center justify-center">
            <span className="text-white font-extrabold text-2xl">{initial}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          }
        </div>
      </button>

      {/* Edit badge */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F5A623] rounded-full flex items-center justify-center shadow-sm pointer-events-none">
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {error && (
        <p className="absolute top-full left-0 mt-1 text-[10px] text-red-500 bg-white border border-red-100 rounded px-2 py-1 shadow-sm whitespace-nowrap z-10">
          {error}
        </p>
      )}
    </div>
  )
}
