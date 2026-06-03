import Link from 'next/link'

interface LogoProps {
  /** 'dark' wordmark for light backgrounds, 'light' for dark backgrounds */
  variant?: 'dark' | 'light'
  /** show the small "GLOBAL TRADE" tagline under the wordmark */
  tagline?: boolean
  /** wrap in a Link to home */
  href?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = {
  sm: { mark: 'w-8 h-8',   word: 'text-base',   glyph: 'text-xs',  tag: 'text-[7px]' },
  md: { mark: 'w-9 h-9',   word: 'text-lg',     glyph: 'text-sm',  tag: 'text-[8px]' },
  lg: { mark: 'w-11 h-11', word: 'text-2xl',    glyph: 'text-lg',  tag: 'text-[9px]' },
}

/**
 * Modern text-based TTAI EMA logo.
 * Geometric monogram mark + bold two-tone wordmark + uppercase tagline.
 */
export function Logo({ variant = 'dark', tagline = true, href = '/', size = 'md', className = '' }: LogoProps) {
  const s = SIZE[size]
  const navy   = variant === 'light' ? 'text-white' : 'text-[#0B1F4D]'
  const tagCol = variant === 'light' ? 'text-white/45' : 'text-gray-400'

  const inner = (
    <span className={`inline-flex items-center gap-2.5 group ${className}`}>
      {/* Monogram mark */}
      <span className={`relative grid place-items-center ${s.mark} rounded-xl bg-gradient-to-br from-[#0B1F4D] via-[#16306b] to-[#1e40af] shadow-md overflow-hidden flex-shrink-0`}>
        {/* shine sweep on hover */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[800ms] ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
        {/* glyph: stylised T + arc */}
        <svg viewBox="0 0 24 24" className={`${s.mark} p-1.5 relative`} fill="none">
          <path d="M5 6.5h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 6.5V19" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M5.5 15.5a7 7 0 0 0 13 0" stroke="#F5A623" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#F5A623] border-2 border-white" />
      </span>

      {/* Wordmark */}
      <span className="leading-none">
        <span className="flex items-baseline tracking-tight">
          <span className={`${s.word} font-black ${navy}`}>TTAI</span>
          <span className={`${s.word} font-black text-[#F5A623]`}>EMA</span>
        </span>
        {tagline && (
          <span className={`block ${s.tag} font-extrabold tracking-[0.22em] uppercase mt-0.5 ${tagCol}`}>
            Global Trade
          </span>
        )}
      </span>
    </span>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}
