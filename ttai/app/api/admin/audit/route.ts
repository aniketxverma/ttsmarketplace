import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function GET(request: Request) {
  await requireRole('admin')
  const { searchParams } = new URL(request.url)

  const targetType = searchParams.get('target_type')
  const targetId   = searchParams.get('target_id')
  const actorId    = searchParams.get('actor_id')
  const action     = searchParams.get('action')
  const from       = searchParams.get('from')
  const to         = searchParams.get('to')
  const page       = parseInt(searchParams.get('page') || '1')
  const pageSize   = parseInt(searchParams.get('pageSize') || '50')

  const supabase = createClient()

  let query = supabase
    .from('admin_audit_log')
    .select('*, profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (targetType) query = query.eq('target_type', targetType)
  if (targetId)   query = query.eq('target_id', targetId)
  if (actorId)    query = query.eq('actor_id', actorId)
  if (action)     query = query.eq('action', action)
  if (from)       query = query.gte('created_at', from)
  if (to)         query = query.lte('created_at', to)

  const offset = (page - 1) * pageSize
  const { data, count, error } = await query.range(offset, offset + pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    entries: data,
    pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
  })
}
