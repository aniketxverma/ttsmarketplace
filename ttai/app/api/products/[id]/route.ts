import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `*,
      suppliers!supplier_id(legal_name, trade_name, logo_url, reliability_tier, status, description, country_id, city_id),
      categories(id, name, slug, parent_id),
      product_images(url, sort_order)`
    )
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ product: data })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: product } = await supabase
    .from('products')
    .select('supplier_id, suppliers!supplier_id(owner_id)')
    .eq('id', params.id)
    .single()

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supplier = product.suppliers as any as { owner_id: string } | null
  if (supplier?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ product: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the caller owns this product (or is admin).
  const { data: product } = await supabase
    .from('products')
    .select('id, suppliers!supplier_id(owner_id)')
    .eq('id', params.id)
    .single()
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supplier = product.suppliers as any as { owner_id: string } | null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (supplier?.owner_id !== user.id && me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Hard delete (admin client bypasses RLS). Clear rows that have no ON DELETE
  // CASCADE first; product_images cascade automatically.
  const admin = createAdminClient()
  await admin.from('order_items').delete().eq('product_id', params.id)
  await (admin.from('broker_promotions') as any).delete().eq('product_id', params.id)
  const { error } = await admin.from('products').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
