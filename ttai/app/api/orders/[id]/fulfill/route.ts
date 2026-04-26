import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, supplier_id')
    .eq('id', params.id)
    .eq('supplier_id', supplier.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'paid') return NextResponse.json({ error: 'Order must be in paid status to fulfill' }, { status: 422 })

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'fulfilled' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ order: data })
}
