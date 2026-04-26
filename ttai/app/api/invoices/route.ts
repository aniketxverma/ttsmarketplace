import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = createAdminClient().from('invoices').select('*').order('issued_at', { ascending: false })

  if (profile?.role === 'supplier') {
    const { data: supplier } = await createAdminClient().from('suppliers').select('id').eq('user_id', user.id).single()
    if (!supplier) return NextResponse.json({ invoices: [] })
    query = query.eq('supplier_id', supplier.id)
  } else if (profile?.role === 'broker') {
    const { data: broker } = await createAdminClient().from('brokers').select('id').eq('user_id', user.id).single()
    if (!broker) return NextResponse.json({ invoices: [] })
    query = query.eq('broker_id', broker.id)
  } else if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data })
}
