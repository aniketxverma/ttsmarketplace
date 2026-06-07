import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { ImportWizard } from './ImportWizard'

export default async function ImportProductsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase.from('suppliers').select('id, status').eq('owner_id', user.id).single()
  if (!supplier) redirect('/supplier/onboarding')

  const { data: categories } = await supabase
    .from('categories').select('id, name, parent_id').order('sort_order')

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import products from Excel</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Upload a supplier price list (.xlsx). We auto-detect the columns and pull in the embedded
          product photos. Everything imports as <strong>drafts</strong> for you to review and publish.
        </p>
      </div>
      <ImportWizard categories={(categories ?? []) as { id: string; name: string; parent_id: string | null }[]} />
    </div>
  )
}
