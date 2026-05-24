'use client'

import { useEffect, useRef } from 'react'

// Animated number counter
function AnimCount({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf: number
    const t0 = performance.now()
    const dur = 1300
    const run = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out-cubic
      el.textContent = Math.round(eased * to) + suffix
      if (p < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [to, suffix])
  return <span ref={ref}>0{suffix}</span>
}

interface StatItem { to: number; suffix: string; label: string }

export function StatsBar({
  yearsExp, productCount, employeeCount, countriesServed,
}: {
  yearsExp?: number | null
  productCount: number
  employeeCount?: number | null
  countriesServed?: number | null
}) {
  const items: StatItem[] = [
    yearsExp         ? { to: yearsExp,        suffix: '+', label: 'yrs experience' } : null,
    productCount > 0 ? { to: productCount,    suffix: '',  label: 'products'       } : null,
    employeeCount    ? { to: employeeCount,   suffix: '+', label: 'employees'      } : null,
    countriesServed  ? { to: countriesServed, suffix: '+', label: 'countries'      } : null,
  ].filter(Boolean) as StatItem[]

  if (items.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes statSlideIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-item { opacity: 0; animation: statSlideIn 0.45s ease forwards; }
      `}</style>
      <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((s, i) => (
          <div key={s.label} className="stat-item flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="text-[15px] font-extrabold text-[#0B1F4D]">
              <AnimCount to={s.to} suffix={s.suffix} />
            </span>
            <span className="text-xs text-gray-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
