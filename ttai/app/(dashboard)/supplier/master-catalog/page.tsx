import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { MasterCatalogClient } from './MasterCatalogClient'
import { UpgradeGate } from '@/components/supplier/UpgradeGate'
import { tierRank } from '@/lib/business-chain'

export default async function MasterCatalogPage() {
  
  const tt = await localizeUI(["Master catalog"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) redirect('/supplier/onboarding')

  const { data: prof } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
  const paid = tierRank(prof?.tier) >= 1

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tt("Master catalog")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Search the global product database and import a product into your profile — the name, brand,
          images, description &amp; specs are copied. You only add price, stock, SKU, condition &amp; location.
        </p>
      </div>
      {paid ? (
        <MasterCatalogClient />
      ) : (
        <UpgradeGate
          title="Master Catalog"
          description="Import ready-made products from the global database instead of typing every detail. Available on paid plans."
          perks={['Search thousands of master products', 'Copy images, specs & descriptions in one click', 'Only set your price, stock & SKU']}
        />
      )}
    </div>
  )
}
