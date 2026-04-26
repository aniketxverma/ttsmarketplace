import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const context  = searchParams.get('context') || 'wholesale'
  const category = searchParams.get('category')
  const q        = searchParams.get('q')
  const page     = parseInt(searchParams.get('page') || '1')
  const country  = searchParams.get('country')
  const city     = searchParams.get('city')
  const pageSize = 24

  const supabase = createClient()

  let query = supabase
    .from('products')
    .select(
      `*,
      suppliers!inner(legal_name, trade_name, logo_url, reliability_tier, status),
      categories(name, slug),
      product_images(url, sort_order)`,
      { count: 'exact' }
    )
    .eq('is_published', true)
    .eq('suppliers.status', 'ACTIVE')

  if (context === 'wholesale') {
    query = query.in('marketplace_context', ['wholesale', 'both'])
  } else if (context === 'retail') {
    query = query.in('marketplace_context', ['retail', 'both'])
  }

  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (city) {
    const { data: cityRow } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', city)
      .single()
    if (cityRow) query = query.eq('city_id', cityRow.id)
  }

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data: products, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
  })
}
