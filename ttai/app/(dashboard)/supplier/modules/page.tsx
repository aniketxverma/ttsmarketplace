import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/rbac'
import { ModuleActivator } from '@/components/supplier/ModuleActivator'

export const dynamic = 'force-dynamic'

export default async function SupplierModulesPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await (supabase.from('suppliers') as any).select('id').eq('owner_id', user.id).maybeSingle()
  if (!supplier) redirect('/supplier/onboarding')

  let modules: string[] = ['marketplace', 'outlet']
  try {
    const { data } = await (createAdminClient().from('suppliers') as any).select('modules').eq('id', supplier.id).single()
    if (Array.isArray(data?.modules) && data.modules.length) modules = data.modules
  } catch { /* column not migrated yet */ }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">My Modules</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Activate TTAIEMA modules to expand your business — one company profile, many channels.</p>
      </div>
      <ModuleActivator initial={modules} />
      <p className="text-xs text-gray-400">Outlet &amp; Marketplace are part of your base presence. Activating Logistics or Consulting connects you to those teams. Premium membership unlocks advanced features per module.</p>
    </div>
  )
}
