'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered reveal wrapper. Animates children in when they enter the viewport.
 */
export function Reveal({
  children, delay = 0, from = 'up', className = '',
}: {
  children: React.ReactNode
  delay?: number
  from?: 'up' | 'left' | 'right' | 'scale'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect() } },
      { threshold: 0.12, rootMargin: '-30px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hidden =
    from === 'left'  ? 'opacity-0 -translate-x-10' :
    from === 'right' ? 'opacity-0 translate-x-10' :
    from === 'scale' ? 'opacity-0 scale-95' :
    'opacity-0 translate-y-10'

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${shown ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : hidden} ${className}`}>
      {children}
    </div>
  )
}
