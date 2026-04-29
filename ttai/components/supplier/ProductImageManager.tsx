'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface ProductImage {
  id: string
  url: string
  sort_order: number
}

interface Props {
  productId: string
  supplierId: string
  initialImages?: ProductImage[]
}

export function ProductImageManager({ productId, supplierId, initialImages = [] }: Props) {
  const [images, setImages] = useState<ProductImage[]>(
    [...initialImages].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (allowed.length === 0) { setError('Only image files are allowed'); return }
    if (allowed.length > 10) { setError('Maximum 10 images at a time'); return }

    setUploading(true)
    const supabase = createClient()
    const newImages: ProductImage[] = []
    const progress: string[] = []

    for (let i = 0; i < allowed.length; i++) {
      const file = allowed[i]
      progress[i] = 'uploading'
      setUploadProgress([...progress])

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${supplierId}/${productId}/${Date.now()}-${i}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false, contentType: file.type })

      if (uploadErr) {
        progress[i] = 'error'
        setUploadProgress([...progress])
        setError(`Failed to upload ${file.name}: ${uploadErr.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)

      const sortOrder = images.length + newImages.length
      const { data: imgRow, error: insertErr } = await supabase
        .from('product_images')
        .insert({ product_id: productId, url: publicUrl, sort_order: sortOrder })
        .select('id, url, sort_order')
        .single()

      if (insertErr || !imgRow) {
        progress[i] = 'error'
        setUploadProgress([...progress])
        setError(`DB error for ${file.name}: ${insertErr?.message}`)
        continue
      }

      progress[i] = 'done'
      setUploadProgress([...progress])
      newImages.push(imgRow)
    }

    setImages(prev => [...prev, ...newImages])
    setUploading(false)
    setUploadProgress([])
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(img: ProductImage) {
    const supabase = createClient()
    await supabase.from('product_images').delete().eq('id', img.id)

    // Try delete from storage (extract path from URL)
    const url = new URL(img.url)
    const parts = url.pathname.split('/product-images/')
    if (parts[1]) {
      await supabase.storage.from('product-images').remove([decodeURIComponent(parts[1])])
    }

    const remaining = images.filter(i => i.id !== img.id)
    // Re-number sort_order
    const reordered = remaining.map((im, idx) => ({ ...im, sort_order: idx }))
    setImages(reordered)

    // Update sort_orders in DB
    for (const im of reordered) {
      await supabase.from('product_images').update({ sort_order: im.sort_order }).eq('id', im.id)
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newImages = [...images]
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= newImages.length) return

    ;[newImages[index], newImages[swapWith]] = [newImages[swapWith], newImages[index]]
    const reordered = newImages.map((im, idx) => ({ ...im, sort_order: idx }))
    setImages(reordered)

    const supabase = createClient()
    for (const im of reordered) {
      await supabase.from('product_images').update({ sort_order: im.sort_order }).eq('id', im.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
              <Image src={img.url} alt={`Product image ${i + 1}`} fill className="object-cover" sizes="160px" />

              {/* Primary badge */}
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-[#F5A623] text-[#0B1F4D] text-[10px] font-black px-2 py-0.5 rounded-full z-10">
                  Primary
                </span>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                {/* Move buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(i, 'up')}
                    disabled={i === 0}
                    className="w-7 h-7 rounded-lg bg-white/90 text-gray-800 flex items-center justify-center hover:bg-white disabled:opacity-30 text-xs font-bold transition-colors"
                    title="Move left / set as primary"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(i, 'down')}
                    disabled={i === images.length - 1}
                    className="w-7 h-7 rounded-lg bg-white/90 text-gray-800 flex items-center justify-center hover:bg-white disabled:opacity-30 text-xs font-bold transition-colors"
                    title="Move right"
                  >
                    →
                  </button>
                </div>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Add more tile */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0B1F4D] hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#0B1F4D] disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-semibold">Add more</span>
          </button>
        </div>
      )}

      {/* Empty state upload zone */}
      {images.length === 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#0B1F4D] hover:bg-blue-50/30 transition-all p-10 flex flex-col items-center gap-3 text-gray-400 hover:text-[#0B1F4D] disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Click to upload product images</p>
            <p className="text-xs mt-1">JPG, PNG, WebP — up to 5 MB each · Multiple files allowed</p>
          </div>
        </button>
      )}

      {/* Upload in progress */}
      {uploading && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
          <svg className="animate-spin w-4 h-4 text-[#0B1F4D] flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-blue-800 font-medium">
            Uploading {uploadProgress.filter(p => p === 'done').length} / {uploadProgress.length} images...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        First image is the primary listing photo. Hover any image to reorder or delete.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  )
}
