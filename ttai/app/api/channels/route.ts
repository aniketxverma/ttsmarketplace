import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/channels — supplier: get own channel
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!supplier) return NextResponse.json({ error: 'Not a supplier' }, { status: 403 })

  const { data: channel } = await (supabase.from('supplier_channels') as any)
    .select('*')
    .eq('supplier_id', supplier.id)
    .maybeSingle()

  return NextResponse.json({ channel: channel ?? null })
}

// POST /api/channels — supplier: create channel (one per supplier)
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await (supabase.from('suppliers') as any)
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!supplier) return NextResponse.json({ error: 'Not a supplier' }, { status: 403 })

  const body = await req.json()
  const { name, description, whatsapp } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })

  const { data: channel, error } = await (supabase.from('supplier_channels') as any)
    .insert({
      supplier_id: supplier.id,
      name:        name.trim(),
      description: description?.trim() || null,
      whatsapp:    whatsapp?.trim()    || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Canal already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ channel }, { status: 201 })
}
