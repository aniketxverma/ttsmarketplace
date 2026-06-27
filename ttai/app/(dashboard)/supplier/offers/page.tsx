import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { OffersManager } from './OffersManager'

export const dynamic = 'force-dynamic'

export default async function SendOffersPage() {
  
  const tt = await localizeUI(["Send Offers"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers').select('id, trade_name, legal_name').eq('owner_id', user.id).maybeSingle()
  if (!supplier) redirect('/supplier/onboarding')

  const admin = createAdminClient()

  // Products to feature in an offer.
  const { data: products } = await (admin.from('products') as any)
    .select('id, name, price_cents, currency_code, is_published, product_images(url, sort_order)')
    .eq('supplier_id', supplier.id).order('created_at', { ascending: false }).limit(200)

  // Client contacts = the supplier's sales-network members (defensive if not migrated).
  let contacts: any[] = []
  try {
    const { data } = await (admin.from('sales_network') as any)
      .select('company_name, email, whatsapp, level, status')
      .eq('inviter_supplier_id', supplier.id)
    contacts = data ?? []
  } catch { /* not migrated */ }

  // Past offers.
  let offers: any[] = []
  try {
    const { data } = await (admin.from('supplier_offers') as any)
      .select('id, token, title, message, discount_pct, product_ids, audience, created_at')
      .eq('supplier_id', supplier.id).order('created_at', { ascending: false })
    offers = data ?? []
  } catch { /* not migrated */ }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const supplierName = supplier.trade_name ?? supplier.legal_name ?? 'My company'

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tt("Send Offers")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Broadcast a promotion to your clients &amp; sales network by WhatsApp or email — pick products,
          add a discount, choose who receives it.
        </p>
      </div>
      <OffersManager
        products={(products ?? []).map((p: any) => ({
          id: p.id, name: p.name, price_cents: p.price_cents, currency: p.currency_code,
          image: (p.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null,
          published: p.is_published,
        }))}
        contacts={contacts}
        initialOffers={offers}
        appUrl={base}
        supplierName={supplierName}
      />
    </div>
  )
}
