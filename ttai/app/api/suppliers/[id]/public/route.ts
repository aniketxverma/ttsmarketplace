import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, description, logo_url, reliability_tier, status, country_id, city_id')
    .eq('id', params.id)
    .eq('status', 'ACTIVE')
    .single()

  if (error || !supplier) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(url, sort_order), categories(name, slug)')
    .eq('supplier_id', params.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return NextResponse.json({ supplier, products: products ?? [] })
}
