import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name)), profiles(full_name)')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: data ?? [] })
}
