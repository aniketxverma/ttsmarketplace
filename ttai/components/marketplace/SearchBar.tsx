'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const q = (new FormData(e.currentTarget)).get('q') as string
      const params = new URLSearchParams(searchParams.toString())
      if (q) { params.set('q', q) } else { params.delete('q') }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search products..."
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
        Search
      </button>
    </form>
  )
}
