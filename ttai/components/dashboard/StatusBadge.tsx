import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const STYLES: Record<string, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTIVE:       'bg-green-100 text-green-800 border-green-200',
  SUSPENDED:    'bg-red-100 text-red-800 border-red-200',
  pending:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:         'bg-green-100 text-green-800 border-green-200',
  fulfilled:    'bg-blue-100 text-blue-800 border-blue-200',
  delivered:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled:    'bg-gray-100 text-gray-600 border-gray-200',
  refunded:     'bg-orange-100 text-orange-800 border-orange-200',
  disputed:     'bg-red-100 text-red-800 border-red-200',
  draft:        'bg-gray-100 text-gray-600 border-gray-200',
  issued:       'bg-blue-100 text-blue-800 border-blue-200',
  void:         'bg-gray-100 text-gray-400 border-gray-200',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STYLES[status] ?? 'bg-muted text-muted-foreground border-muted',
        className
      )}
    >
      {status}
    </span>
  )
}
