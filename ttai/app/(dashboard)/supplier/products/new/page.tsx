import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ProductForm } from '@/components/supplier/ProductForm'
import { getPricingConfig } from '@/lib/pricing-config'

export default async function NewProductPage() {
  
  const tt = await localizeUI(["Add Product", "Products start as drafts — publish when ready"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await (supabase
    .from('suppliers') as any)
    .select('id, status, marketplace_context')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')
  // Suppliers can build their shop while still pending review — only suspended
  // accounts are blocked. Verification gates public visibility, not management.
  if (supplier.status === 'SUSPENDED') redirect('/supplier')

  const { data: prof } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
  const sellerTier = prof?.tier ?? 'free'
  const homeChannel = supplier.marketplace_context === 'retail' ? 'retail' : 'wholesale'
  const pricing = await getPricingConfig()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tt("Add Product")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{tt("Products start as drafts — publish when ready")}</p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <ProductForm supplierId={supplier.id} mode="create" sellerTier={sellerTier} homeChannel={homeChannel}
          minMarginPct={pricing.minMarginPct} vatPct={pricing.vatPct} vatEnabled={pricing.vatEnabled} />
      </div>
    </div>
  )
}
