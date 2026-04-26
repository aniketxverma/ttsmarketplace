import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ supplier: data })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!['PENDING', 'UNDER_REVIEW'].includes(supplier.status)) {
    return NextResponse.json({ error: 'Cannot edit supplier in current status' }, { status: 403 })
  }

  const body = await request.json()
  const allowedFields = ['legal_name', 'trade_name', 'tax_id', 'vat_number', 'description', 'address_line1', 'address_line2', 'postal_code', 'logo_url']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowedFields.includes(k)))

  const { data, error } = await supabase
    .from('suppliers')
    .update(update)
    .eq('id', supplier.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ supplier: data })
}
