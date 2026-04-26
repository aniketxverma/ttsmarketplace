import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const retailOnly = searchParams.get('retail_active') === 'true'

  const supabase = createClient()

  let query = supabase
    .from('cities')
    .select('id, name, slug, retail_active, country_id')
    .order('name')

  if (retailOnly) {
    query = query.eq('retail_active', true)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ cities: data })
}
