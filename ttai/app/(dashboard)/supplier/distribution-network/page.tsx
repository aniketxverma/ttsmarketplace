import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDistNetwork } from '@/lib/distribution-network'
import { DistributionNetworkEditor } from '@/components/supplier/DistributionNetworkEditor'

export const dynamic = 'force-dynamic'

export default async function SupplierDistributionNetworkPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id, banner_image, trade_name, legal_name, countries(iso_code, name)')
    .eq('owner_id', user.id).maybeSingle()
  if (!supplier) redirect('/supplier/onboarding')

  const net = await getDistNetwork(createAdminClient(), supplier.id)
  const initial = net ?? {
    center: {
      title: 'Head Office / Factory',
      subtitle: (supplier.countries as any)?.name ?? '',
      iso: (supplier.countries as any)?.iso_code ?? '',
      since: '',
      image: supplier.banner_image ?? '',
    },
    nodes: [],
  }

  return <DistributionNetworkEditor initial={initial} />
}
