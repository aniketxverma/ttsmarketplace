import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  /** kept for API compatibility (image carries its own colours) */
  variant?: 'dark' | 'light'
  /** kept for API compatibility */
  tagline?: boolean
  /** wrap in a Link to home */
  href?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Display heights (px). Width follows the logo's ~3:2 ratio.
const HEIGHT = { sm: 30, md: 40, lg: 56 }

/** TTAIEMA brand logo (gold Z monogram + wordmark). */
export function Logo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const h = HEIGHT[size]
  const w = Math.round(h * 1.5)

  const inner = (
    <Image
      src="/logo.png"
      alt="TTAIEMA"
      width={w * 2}
      height={h * 2}
      priority
      sizes={`${w}px`}
      style={{ height: h, width: 'auto' }}
      className={`object-contain ${className}`}
    />
  )

  return href ? <Link href={href} className="inline-flex items-center">{inner}</Link> : inner
}
