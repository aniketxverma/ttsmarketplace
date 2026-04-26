import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function GET(request: Request) {
  await requireRole('admin')
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const country = searchParams.get('country')
  const limit = parseInt(searchParams.get('limit') ?? '500', 10)

  const supabase = createClient()

  let query = supabase
    .from('suppliers')
    .select('*, countries(iso_code, name)')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (country) query = query.eq('country_id', country)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ suppliers: data })
}
