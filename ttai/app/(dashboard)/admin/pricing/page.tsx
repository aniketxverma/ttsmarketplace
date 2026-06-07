import { requireRole } from '@/lib/auth/rbac'
import { getPricingConfig } from '@/lib/pricing-config'
import { PricingManager } from './PricingManager'

export default async function AdminPricingPage() {
  await requireRole('admin')
  const cfg = await getPricingConfig()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pricing rules</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Protect retailers and keep the market healthy. The end-user price can never fall below
          wholesale + the minimum margin; VAT is applied on top for display.
        </p>
      </div>
      <PricingManager initial={cfg} />
    </div>
  )
}
