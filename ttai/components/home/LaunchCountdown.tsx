'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Rocket } from 'lucide-react'

/** Live countdown to Opening Day, shown on the homepage during pre-opening. */
export function LaunchCountdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Avoid SSR/client mismatch — render nothing until mounted.
  if (now === null) return null

  const diff = Math.max(0, new Date(target).getTime() - now)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor(diff / 3_600_000) % 24
  const mins = Math.floor(diff / 60_000) % 60
  const secs = Math.floor(diff / 1_000) % 60
  const units = [
    { v: days, l: 'Days' },
    { v: hours, l: 'Hours' },
    { v: mins, l: 'Minutes' },
    { v: secs, l: 'Seconds' },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] py-12 px-4">
      <div className="absolute -top-20 -left-16 w-80 h-80 rounded-full bg-[#F5A623]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-[#2563eb]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" /> Opening Soon
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">The marketplace opens in</h2>

        <div className="mt-7 flex items-stretch justify-center gap-2.5 sm:gap-4">
          {units.map((u, i) => (
            <div key={u.l} className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-[72px] sm:w-24 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur px-2 py-3 sm:py-4 shadow-lg">
                <div className="text-3xl sm:text-5xl font-extrabold text-white tabular-nums leading-none">
                  {String(u.v).padStart(2, '0')}
                </div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300/80 mt-2">{u.l}</div>
              </div>
              {i < units.length - 1 && <span className="text-2xl sm:text-4xl font-extrabold text-[#F5A623]/70 -mt-1">:</span>}
            </div>
          ))}
        </div>

        <p className="text-blue-200/80 text-sm mt-7 max-w-xl mx-auto">
          Businesses can register now and build their shop ahead of launch. Verification, full browsing and promotions go live on opening day.
        </p>
        <Link href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] hover:bg-[#fbb93a] text-[#0B1F4D] px-7 py-3 text-sm font-extrabold transition-colors mt-5">
          <Rocket className="w-4 h-4" /> Reserve your shop
        </Link>
      </div>
    </section>
  )
}
