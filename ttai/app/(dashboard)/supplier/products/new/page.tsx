import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ProductForm } from '@/components/supplier/ProductForm'

export default async function NewProductPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')
  if (supplier.status !== 'ACTIVE') redirect('/supplier')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Product</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Products start as drafts — publish when ready</p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <ProductForm supplierId={supplier.id} mode="create" />
      </div>
    </div>
  )
}
