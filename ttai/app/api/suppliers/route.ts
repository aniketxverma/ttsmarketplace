import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupplierSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('suppliers')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Supplier already exists' }, { status: 409 })

  const body = await request.json()
  const parsed = createSupplierSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert({
      owner_id:            user.id,
      legal_name:          parsed.data.legalName,
      trade_name:          parsed.data.tradeName,
      tax_id:              parsed.data.taxId,
      vat_number:          parsed.data.vatNumber,
      country_id:          parsed.data.countryId,
      city_id:             parsed.data.cityId,
      address_line1:       parsed.data.addressLine1,
      postal_code:         parsed.data.postalCode,
      marketplace_context: parsed.data.marketplaceContext,
      description:         parsed.data.description,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('profiles').update({ role: 'supplier' }).eq('id', user.id)

  return NextResponse.json({ supplier }, { status: 201 })
}

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
