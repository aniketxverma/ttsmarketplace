import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { RegionManager } from './RegionManager'

export default async function SupplierRegionsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  const { data: rows } = await supabase
    .from('supplier_regions' as any)
    .select('region_key')
    .eq('supplier_id', supplier.id)

  const saved = (rows ?? []).map((r: any) => r.region_key as string)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Regions &amp; Markets</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Select the regions and countries you supply to. Your products will appear on the corresponding region pages in the marketplace.
        </p>
      </div>

      <RegionManager supplierId={supplier.id} initialKeys={saved} />
    </div>
  )
}
