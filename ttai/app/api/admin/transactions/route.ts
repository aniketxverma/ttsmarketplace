import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function GET(request: Request) {
  await requireRole('admin')
  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const orderId  = searchParams.get('order_id')

  const supabase = createClient()

  let query = supabase
    .from('transaction_ledger')
    .select('*, orders(status, buyer_id, supplier_id)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (orderId) query = query.eq('order_id', orderId)

  const offset = (page - 1) * pageSize
  const { data, count, error } = await query.range(offset, offset + pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ledger: data,
    pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
  })
}
