import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInvoice } from '@/lib/invoices/generate'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { order_id, type } = await req.json()
  if (!order_id || !['supplier', 'broker'].includes(type)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const invoice = await generateInvoice({ orderId: order_id, type })
    return NextResponse.json(invoice, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
