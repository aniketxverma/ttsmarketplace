import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Legacy supplier route. Every supplier now uses the premium brand page,
 * looked up by brand_slug or id. Redirect there so the full storefront UI
 * (hero, products, about, gallery, reviews, locations, contact) always shows.
 */
export default async function SupplierProfilePage({
  params,
}: {
  params: { supplierId: string }
}) {
  const supabase = createClient()

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id, brand_slug, status')
    .eq('id', params.supplierId)
    .neq('status', 'SUSPENDED')
    .maybeSingle() as { data: any }

  if (!supplier) notFound()

  redirect(`/brand/${supplier.brand_slug ?? supplier.id}`)
}
