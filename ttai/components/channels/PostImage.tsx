'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * WhatsApp-style post image: a small contained preview that opens full-size
 * in a lightbox on click (Esc / backdrop / ✕ to close).
 */
export function PostImage({ src, rounded = 'rounded-xl' }: { src: string; rounded?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      <img
        src={src} alt="" loading="lazy"
        onClick={() => setOpen(true)}
        className={`w-full max-h-[20rem] object-contain bg-black/[0.03] cursor-zoom-in ${rounded}`}
      />

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-3 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={src} alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg cursor-default"
          />
        </div>
      )}
    </>
  )
}
