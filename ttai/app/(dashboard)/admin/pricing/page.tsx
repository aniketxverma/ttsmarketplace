import { requireRole } from '@/lib/auth/rbac'
import { getPricingConfig, getTaxConfig } from '@/lib/pricing-config'
import { PricingManager } from './PricingManager'

export default async function AdminPricingPage() {
  await requireRole('admin')
  const [cfg, tax] = await Promise.all([getPricingConfig(), getTaxConfig()])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pricing &amp; tax rules</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Protect retailers and stay compliant. The end-user price can never fall below
          wholesale + the minimum margin; VAT and EU B2B reverse-charge are applied automatically.
        </p>
      </div>
      <PricingManager initial={cfg} tax={{ euReverseCharge: tax.euReverseCharge, reverseChargeCategories: tax.reverseChargeCategories.join(', ') }} />
    </div>
  )
}
