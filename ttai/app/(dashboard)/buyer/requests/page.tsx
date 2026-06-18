import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { BuyerRequestCard } from '@/components/purchase/BuyerRequestCard'
import { ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BuyerRequestsPage() {
  const user = await requireAuth()

  let requests: any[] = []
  try {
    const { data } = await (createAdminClient().from('purchase_requests') as any)
      .select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(200)
    requests = data ?? []
  } catch { /* migration 0077 pending */ }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">My Purchase Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">B2B requests you sent — pay only after the supplier confirms stock, price &amp; delivery.</p>
      </div>
      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-semibold">No purchase requests yet</p>
          <p className="text-gray-400 text-sm mt-1">Use “Want to Buy” on a B2B product to send a request.</p>
        </div>
      ) : (
        <div className="space-y-3">{requests.map((r) => <BuyerRequestCard key={r.id} r={r} />)}</div>
      )}
    </div>
  )
}
