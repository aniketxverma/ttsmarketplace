import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { PosManager } from './PosManager'

export default async function SupplierPosPage() {
  
  const tt = await localizeUI(["My Locations", "Sales Network"], getLocale())
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
          <h1 className="text-2xl font-bold">{tt("My Locations")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your own physical locations — shops, warehouses and pickup points (shown on your profile map).
            To invite partner companies into your network, use <span className="font-semibold">{tt("Sales Network")}</span>.
          </p>
        </div>
      </div>
      <PosManager supplierId={supplier.id} initialPosList={(posList ?? []) as any[]} />
    </div>
  )
}
