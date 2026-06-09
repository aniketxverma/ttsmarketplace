import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMasterSellers } from '@/lib/offers-server'

export const revalidate = 60

/**
 * Legacy master page. The multi-seller comparison now lives on the rich product
 * page (/product/[slug]) under "Available Sellers". We redirect to the best offer's
 * product page so old /p/[id] links keep working and users land on the good UI.
 */
export default async function MasterRedirect({ params, searchParams }: { params: { id: string }; searchParams: { shop?: string } }) {
  const admin = createAdminClient()
  const sellers = await getMasterSellers(admin, params.id, { retail: searchParams.shop === 'online' })
  if (!sellers.length) {
    // No active offers — fall back to the master record's existence check.
    const { data: m } = await (admin.from('master_products') as any).select('id').eq('id', params.id).maybeSingle()
    if (!m) notFound()
    redirect('/marketplace')
  }
  redirect(sellers[0].href) // best (cheapest-total) offer's product page
}
