import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { appBaseUrl } from '@/lib/app-url'
import { NetworkManager } from './NetworkManager'

export const dynamic = 'force-dynamic'

export default async function SalesNetworkPage() {
  
  const tt = await localizeUI(["My Sales Network"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, trade_name, legal_name, status')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!supplier) redirect('/supplier/onboarding')

  // Read via admin (RLS is closed on sales_network); defensive if not migrated.
  let members: any[] = []
  try {
    const admin = createAdminClient()
    const { data } = await (admin.from('sales_network') as any)
      .select('id, company_name, contact_person, email, whatsapp, country, city, address, level, status, token, imported_catalog, created_at, accepted_at, member_supplier_id')
      .eq('inviter_supplier_id', supplier.id)
      .order('created_at', { ascending: false })
    members = data ?? []
  } catch { /* table not migrated yet */ }

  const base = appBaseUrl()
  const inviterName = supplier.trade_name ?? supplier.legal_name ?? 'My company'

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tt("My Sales Network")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Invite shops, distributors and partners to join your official sales network — they get an online
          store and can import your catalogue automatically.
        </p>
      </div>
      <NetworkManager initialMembers={members} appUrl={base} inviterName={inviterName} />
    </div>
  )
}
