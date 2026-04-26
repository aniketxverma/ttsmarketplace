'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/domain'

interface CategoryNavProps {
  categories: Category[]
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('category')

  function buildHref(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', slug)
    params.delete('page')
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold px-2 pb-2 text-muted-foreground uppercase tracking-wide">Categories</h3>
      <Link
        href={pathname}
        className={cn(
          'block rounded-md px-2 py-1.5 text-sm hover:bg-accent',
          !active && 'bg-accent font-medium'
        )}
      >
        All Products
      </Link>
      {categories.map((cat) => (
        <div key={cat.id}>
          <Link
            href={buildHref(cat.slug)}
            className={cn(
              'block rounded-md px-2 py-1.5 text-sm hover:bg-accent',
              active === cat.slug && 'bg-accent font-medium'
            )}
          >
            {cat.name}
          </Link>
          {cat.children?.map((sub) => (
            <Link
              key={sub.id}
              href={buildHref(sub.slug)}
              className={cn(
                'block rounded-md pl-5 pr-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
                active === sub.slug && 'bg-accent text-foreground font-medium'
              )}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}
