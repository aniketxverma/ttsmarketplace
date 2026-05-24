'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface Img { url: string; sort_order: number }

export function ProductImageGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0)
  const img = images[active]

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
        <Package className="w-20 h-20 text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F5F5F3] border border-gray-100 shadow-sm">
        <Image
          src={img.url}
          alt={name}
          fill
          className="object-contain p-4 transition-opacity duration-200"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((im, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-[#0B1F4D] shadow-md' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="relative w-full h-full bg-[#F5F5F3]">
                <Image src={im.url} alt={`${name} ${i + 1}`} fill className="object-cover" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
