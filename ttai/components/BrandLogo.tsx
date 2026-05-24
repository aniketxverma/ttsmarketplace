'use client'

import { useState } from 'react'
import Image from 'next/image'

interface BrandLogoProps {
  src: string | null
  name: string
  size?: number
  /** Extra classes on the <Image> element */
  imgClassName?: string
  /** Extra classes on the fallback initials div */
  fallbackClassName?: string
  /** Font size class for the initials letter */
  textClass?: string
}

/**
 * Client component — shows supplier logo with graceful onError fallback.
 * Renders the company initial inside a navy box when the image fails to load
 * (e.g. Supabase Storage 400/404, missing file, wrong path).
 */
export function BrandLogo({
  src,
  name,
  size = 88,
  imgClassName = 'object-cover w-full h-full',
  fallbackClassName = '',
  textClass = 'text-3xl',
}: BrandLogoProps) {
  const [errored, setErrored] = useState(false)
  const initial = (name ?? 'S')[0].toUpperCase()

  if (!src || errored) {
    return (
      <div className={`w-full h-full bg-[#0B1F4D] flex items-center justify-center ${fallbackClassName}`}>
        <span className={`text-white font-extrabold ${textClass}`}>{initial}</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={name ?? ''}
      width={size}
      height={size}
      className={imgClassName}
      onError={() => setErrored(true)}
    />
  )
}
