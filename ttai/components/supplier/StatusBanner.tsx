import type { SupplierStatus } from '@/types/domain'

const BANNERS: Record<SupplierStatus, { bg: string; text: string; message: string }> = {
  PENDING:      { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', message: 'Verification pending. Add required documents to expedite review.' },
  UNDER_REVIEW: { bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-800',   message: "Your application is under review. We'll notify you within 48 hours." },
  ACTIVE:       { bg: 'bg-green-50 border-green-200',  text: 'text-green-800',  message: 'Verified supplier. You can now publish products.' },
  SUSPENDED:    { bg: 'bg-red-50 border-red-200',      text: 'text-red-800',    message: 'Your account is suspended. Contact support.' },
}

export function StatusBanner({ status }: { status: SupplierStatus }) {
  if (status === 'ACTIVE') return null
  const b = BANNERS[status]
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${b.bg} ${b.text}`}>
      {b.message}
    </div>
  )
}
