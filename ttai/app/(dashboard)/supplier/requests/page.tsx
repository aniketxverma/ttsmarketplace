import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { SupplierRequestCard } from '@/components/purchase/SupplierRequestCard'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SupplierRequestsPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await (supabase.from('suppliers') as any).select('id').eq('owner_id', user.id).maybeSingle()
  if (!supplier) redirect('/supplier/onboarding')

  let requests: any[] = []
  try {
    const { data } = await (createAdminClient().from('purchase_requests') as any)
      .select('*').eq('supplier_id', supplier.id).order('created_at', { ascending: false }).limit(200)
    requests = data ?? []
  } catch { /* migration 0077 pending */ }

  const open = requests.filter((r) => r.status === 'requested').length

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Purchase Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">B2B buyers requesting to buy — confirm stock, quantity, final price &amp; delivery, then they pay.</p>
      </div>
      {open > 0 && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">⚠ {open} request{open !== 1 ? 's' : ''} awaiting your confirmation.</p>}

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-semibold">No purchase requests yet</p>
          <p className="text-gray-400 text-sm mt-1">When a buyer clicks “Want to Buy” on your products, it appears here.</p>
        </div>
      ) : (
        <div className="space-y-3">{requests.map((r) => <SupplierRequestCard key={r.id} r={r} />)}</div>
      )}
    </div>
  )
}
