import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPromotionSchema } from '@/lib/validation/schemas'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const url = new URL(req.url)
  const productId = url.searchParams.get('product_id')

  // Use broker_promotions table (actual table name in DB)
  let query = supabase
    .from('broker_promotions')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', new Date().toISOString())
    .gte('ends_at', new Date().toISOString())

  if (productId) query = query.eq('product_id', productId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ promotions: data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createPromotionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const admin = createAdminClient()

  const { data: broker } = await admin
    .from('brokers')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!broker || broker.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Active broker account required' }, { status: 403 })
  }

  // Map camelCase schema fields → snake_case DB columns
  const { data, error } = await admin
    .from('broker_promotions')
    .insert({
      broker_id: broker.id,
      product_id: parsed.data.productId,
      promotion_slot: parsed.data.promotionSlot,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      custom_pitch: parsed.data.customPitch ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
