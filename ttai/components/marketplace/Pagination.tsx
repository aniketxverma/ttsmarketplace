'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          Previous
        </Link>
      )}
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = i + 1
        return (
          <Link
            key={p}
            href={buildHref(p)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm hover:bg-accent',
              p === page && 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
            )}
          >
            {p}
          </Link>
        )
      })}
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          Next
        </Link>
      )}
    </div>
  )
}
