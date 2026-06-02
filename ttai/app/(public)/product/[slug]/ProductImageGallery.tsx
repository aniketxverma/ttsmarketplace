'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Package, ChevronLeft, ChevronRight, Expand } from 'lucide-react'

interface Img { url: string; sort_order: number }

export function ProductImageGallery({ images, name }: { images: Img[]; name: string }) {
  const [active,   setActive]   = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActive(i => (i + 1) % images.length),                 [images.length])

  if (!images.length) {
    return (
      <div className="aspect-square rounded-3xl bg-gray-100 flex items-center justify-center">
        <Package className="w-20 h-20 text-gray-300" />
      </div>
    )
  }

  const img = images[active]

  return (
    <>
      <div className="space-y-3">
        {/* ── Main image ──────────────────────────────────────────────── */}
        <div className="relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group cursor-zoom-in"
          onClick={() => setLightbox(true)}>

          <Image
            src={img.url}
            alt={name}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />

          {/* Expand hint */}
          <div className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Expand className="w-3.5 h-3.5 text-gray-600" />
          </div>

          {/* Arrow nav — only when multiple images */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:shadow-lg"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:shadow-lg"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Image counter pill */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full pointer-events-none">
              {active + 1} / {images.length}
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ─────────────────────────────────────────── */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((im, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden transition-all duration-200 ${
                  i === active
                    ? 'ring-2 ring-[#0B1F4D] ring-offset-2 shadow-md'
                    : 'border-2 border-gray-100 hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="relative w-full h-full bg-white">
                  <Image src={im.url} alt={`${name} ${i + 1}`} fill className="object-contain" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          {/* Close on backdrop click; stop propagation on image */}
          <div className="relative w-full max-w-3xl aspect-square" onClick={e => e.stopPropagation()}>
            <Image
              src={img.url}
              alt={name}
              fill
              className="object-contain"
              sizes="90vw"
            />

            {/* Lightbox arrows */}
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button type="button" onClick={next}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Lightbox counter */}
            {images.length > 1 && (
              <p className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-10 text-white/60 text-sm font-semibold">
                {active + 1} / {images.length}
              </p>
            )}
          </div>

          {/* Close hint */}
          <p className="absolute top-5 right-5 text-white/40 text-sm">Click anywhere to close</p>
        </div>
      )}
    </>
  )
}
