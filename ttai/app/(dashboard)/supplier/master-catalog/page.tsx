import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { MasterCatalogClient } from './MasterCatalogClient'

export default async function MasterCatalogPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) redirect('/supplier/onboarding')

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Master catalog</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Search the global product database and import a product into your profile — the name, brand,
          images, description &amp; specs are copied. You only add price, stock, SKU, condition &amp; location.
        </p>
      </div>
      <MasterCatalogClient />
    </div>
  )
}
