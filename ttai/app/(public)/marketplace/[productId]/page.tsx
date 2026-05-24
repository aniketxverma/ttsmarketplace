/**
 * Legacy route — redirects to the unified product template at /product/[slug].
 * Kept so that any old bookmarks or external links to /marketplace/:id still work.
 */
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LegacyProductRedirect({
  params,
}: {
  params: { productId: string }
}) {
  const supabase = createClient()

  // Look up the product's slug by its UUID
  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', params.productId)
    .eq('is_published', true)
    .single()

  if (!product) notFound()

  // Permanent redirect to the canonical product URL
  redirect(`/product/${product.slug ?? params.productId}`)
}
