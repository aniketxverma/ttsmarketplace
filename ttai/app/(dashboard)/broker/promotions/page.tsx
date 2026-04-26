import { requireRole } from '@/lib/auth/rbac'

export default async function BrokerPromotionsPage() {
  await requireRole('broker')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Promotions</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage discount codes and promotional campaigns</p>
      </div>
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Promotions management coming in Phase 1 (Packet 08)</p>
      </div>
    </div>
  )
}
