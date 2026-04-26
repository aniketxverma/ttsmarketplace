import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBrokerSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('brokers').select('id').eq('user_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'Broker already registered' }, { status: 409 })

  const body = await request.json()
  const parsed = createBrokerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: broker, error } = await supabase
    .from('brokers')
    .insert({
      user_id:          user.id,
      legal_name:       parsed.data.legalName,
      tax_id:           parsed.data.taxId,
      vat_number:       parsed.data.vatNumber,
      tax_jurisdiction: parsed.data.taxJurisdiction,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('profiles').update({ role: 'broker' }).eq('id', user.id)

  return NextResponse.json({ broker }, { status: 201 })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('brokers').select('*').eq('user_id', user.id).single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ broker: data })
}
