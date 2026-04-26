import { cn } from '@/lib/utils'

interface ProductGridProps {
  children: React.ReactNode
  className?: string
}

export function ProductGrid({ children, className }: ProductGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {children}
    </div>
  )
}
