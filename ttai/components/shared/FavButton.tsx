'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

// Persistent favourite toggle (localStorage). Works on any card — stores, shops,
// companies, products — keyed by kind so each list has its own saved set.
export function FavButton({ id, kind = 'store', className = '' }: { id: string; kind?: string; className?: string }) {
  const key = `ttai_fav_${kind}`
  const [on, setOn] = useState(false)

  useEffect(() => {
    try { setOn((JSON.parse(localStorage.getItem(key) || '[]') as string[]).includes(id)) } catch { /* ignore */ }
  }, [id, key])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[]
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
      localStorage.setItem(key, JSON.stringify(next))
      setOn(next.includes(id))
    } catch { /* ignore */ }
  }

  return (
    <button type="button" onClick={toggle} aria-label={on ? 'Remove from saved' : 'Save'} className={className}>
      <Heart className={`w-4 h-4 transition-colors ${on ? 'fill-rose-500 text-rose-500' : ''}`} />
    </button>
  )
}
