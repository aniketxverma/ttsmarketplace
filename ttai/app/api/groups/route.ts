import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/groups — supplier: list own WhatsApp groups
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Not a supplier' }, { status: 403 })

  const { data: groups, error } = await (supabase.from('whatsapp_groups') as any)
    .select('*').eq('supplier_id', supplier.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message, groups: [] }, { status: 200 })

  return NextResponse.json({ groups: groups ?? [] })
}

// POST /api/groups — supplier: add a WhatsApp group link
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Not a supplier' }, { status: 403 })

  const { name, description, category, region, invite_link, member_count } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
  const link = (invite_link ?? '').trim()
  if (!/^https?:\/\//i.test(link)) return NextResponse.json({ error: 'A valid WhatsApp invite link is required' }, { status: 400 })

  const row: Record<string, any> = {
    supplier_id:  supplier.id,
    name:         name.trim(),
    description:  description?.trim() || null,
    category:     category?.trim()    || null,
    region:       region?.trim()      || null,
    invite_link:  link,
    member_count: Number.isFinite(+member_count) ? Math.max(0, Math.trunc(+member_count)) : 0,
  }
  // Defensive: `region` column may not be migrated yet → retry without it.
  let { data: group, error } = await (supabase.from('whatsapp_groups') as any).insert(row).select().single()
  if (error && /region/i.test(error.message)) {
    delete row.region
    ;({ data: group, error } = await (supabase.from('whatsapp_groups') as any).insert(row).select().single())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ group }, { status: 201 })
}
