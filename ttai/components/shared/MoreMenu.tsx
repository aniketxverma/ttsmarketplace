'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

type Item = { label: string; href: string }

/** Desktop "More" dropdown — holds the secondary nav links so the header stays clean. */
export function MoreMenu({ items, label }: { items: Item[]; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-[#0B1F4D] rounded-lg hover:bg-gray-50 transition-colors">
        {label} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 z-50">
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-600 hover:text-[#0B1F4D] hover:bg-gray-50 transition-colors">
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
