import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { PosManager } from './PosManager'

export default async function SupplierPosPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, trade_name, status')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier')

  const { data: posList } = await (supabase.from('supplier_pos' as any) as any)
    .select(`
      id, name, type, status, is_public, sort_order,
      pos_locations(id, address_line1, city, country, latitude, longitude),
      pos_details(id, phone, whatsapp, email, manager_name, accepts_walk_ins, accepts_orders, services_offered, opening_hours)
    `)
    .eq('supplier_id', supplier.id)
    .order('sort_order', { ascending: true }) as { data: any[] }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Points of Sale</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your physical locations — shops, warehouses, pickup points and more
          </p>
        </div>
      </div>
      <PosManager supplierId={supplier.id} initialPosList={(posList ?? []) as any[]} />
    </div>
  )
}
