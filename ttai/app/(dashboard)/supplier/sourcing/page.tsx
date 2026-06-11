import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { SourcingClient } from './SourcingClient'
import { UpgradeGate } from '@/components/supplier/UpgradeGate'
import { tierRank } from '@/lib/business-chain'

type Sup = { id: string; name: string }

export default async function SourcingPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase.from('suppliers').select('id, status').eq('owner_id', user.id).single()
  if (!supplier) redirect('/supplier/onboarding')

  const { data: prof } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
  const paid = tierRank(prof?.tier) >= 1
  if (!paid) {
    return (
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sourcing &amp; catalogue sharing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Import products from partner suppliers and share your catalogue.</p>
        </div>
        <UpgradeGate
          title="Sourcing & Catalogue Sharing"
          description="Import products from suppliers who share their catalogue with you, and share yours with partners. Available on paid plans."
          perks={['Import partner catalogues into your shop', 'Share your catalogue with related suppliers', 'Every import keeps a link to its source']}
        />
      </div>
    )
  }

  // Active suppliers (for granting + name lookup)
  const { data: allSup } = await (supabase.from('suppliers') as any)
    .select('id, trade_name, legal_name').eq('status', 'ACTIVE')
  const nameOf = new Map<string, string>((allSup ?? []).map((s: any) => [s.id, s.trade_name ?? s.legal_name ?? 'Supplier']))
  const grantable: Sup[] = (allSup ?? [])
    .filter((s: any) => s.id !== supplier.id)
    .map((s: any) => ({ id: s.id, name: s.trade_name ?? s.legal_name ?? 'Supplier' }))

  // Grants (defensive — table may not be migrated yet)
  let sharedWithMe: Sup[] = []
  let myTargets: Sup[] = []
  try {
    const { data: grants } = await (supabase.from('supplier_share_grants') as any)
      .select('source_supplier_id, target_supplier_id, status').eq('status', 'active')
    for (const g of (grants ?? []) as any[]) {
      if (g.target_supplier_id === supplier.id) sharedWithMe.push({ id: g.source_supplier_id, name: nameOf.get(g.source_supplier_id) ?? 'Supplier' })
      if (g.source_supplier_id === supplier.id) myTargets.push({ id: g.target_supplier_id, name: nameOf.get(g.target_supplier_id) ?? 'Supplier' })
    }
  } catch { /* table missing — leave empty */ }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sourcing &amp; catalogue sharing</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Import products from suppliers who share their catalogue with you — or share yours with related suppliers.
          Every imported product keeps a link to its original source.
        </p>
      </div>
      <SourcingClient sharedWithMe={sharedWithMe} myTargets={myTargets} grantable={grantable} />
    </div>
  )
}
