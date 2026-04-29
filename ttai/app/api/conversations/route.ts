import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (supabase: ReturnType<typeof createClient>) => supabase as any

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role === 'supplier' || profile?.role === 'broker') {
    const { data: supplier } = await supabase
      .from('suppliers').select('id').eq('owner_id', user.id).single()
    if (!supplier) return NextResponse.json([])

    const { data } = await db(supabase)
      .from('conversations')
      .select('id, subject, last_message_at, order_id, profiles!buyer_id(full_name)')
      .eq('supplier_id', supplier.id)
      .order('last_message_at', { ascending: false })

    const convIds = ((data as any[]) ?? []).map((c) => c.id)
    const unreadMap: Record<string, number> = {}
    if (convIds.length > 0) {
      const { data: unread } = await db(supabase)
        .from('messages').select('conversation_id')
        .in('conversation_id', convIds).neq('sender_id', user.id).eq('is_read', false)
      for (const m of (unread as any[]) ?? [])
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
    }

    return NextResponse.json(
      ((data as any[]) ?? []).map((c) => ({
        id: c.id, subject: c.subject, last_message_at: c.last_message_at,
        order_id: c.order_id, other_name: c.profiles?.full_name ?? 'Buyer',
        unread_count: unreadMap[c.id] ?? 0,
      }))
    )
  }

  // Buyer / business_client
  const { data } = await db(supabase)
    .from('conversations')
    .select('id, subject, last_message_at, order_id, suppliers!supplier_id(legal_name, trade_name)')
    .eq('buyer_id', user.id)
    .order('last_message_at', { ascending: false })

  const convIds = ((data as any[]) ?? []).map((c: any) => c.id)
  const unreadMap: Record<string, number> = {}
  if (convIds.length > 0) {
    const { data: unread } = await db(supabase)
      .from('messages').select('conversation_id')
      .in('conversation_id', convIds).neq('sender_id', user.id).eq('is_read', false)
    for (const m of (unread as any[]) ?? [])
      unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
  }

  return NextResponse.json(
    ((data as any[]) ?? []).map((c: any) => {
      const s = c.suppliers
      return {
        id: c.id, subject: c.subject, last_message_at: c.last_message_at,
        order_id: c.order_id, other_name: s?.trade_name ?? s?.legal_name ?? 'Supplier',
        unread_count: unreadMap[c.id] ?? 0,
      }
    })
  )
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { supplierId, buyerId, orderId, subject } = await req.json()
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  let resolvedBuyerId: string
  let resolvedSupplierId: string

  if (profile?.role === 'supplier' || profile?.role === 'broker') {
    if (!buyerId) return NextResponse.json({ error: 'buyerId required' }, { status: 400 })
    const { data: supplier } = await supabase
      .from('suppliers').select('id').eq('owner_id', user.id).single()
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    resolvedBuyerId = buyerId
    resolvedSupplierId = supplier.id
  } else {
    if (!supplierId) return NextResponse.json({ error: 'supplierId required' }, { status: 400 })
    resolvedBuyerId = user.id
    resolvedSupplierId = supplierId
  }

  let query = db(supabase)
    .from('conversations').select('id')
    .eq('buyer_id', resolvedBuyerId).eq('supplier_id', resolvedSupplierId)

  const finalQuery = orderId ? query.eq('order_id', orderId) : query.is('order_id', null)
  const { data: existing } = await finalQuery.maybeSingle()
  if (existing) return NextResponse.json({ id: (existing as any).id })

  const { data: created, error } = await db(supabase)
    .from('conversations')
    .insert({ buyer_id: resolvedBuyerId, supplier_id: resolvedSupplierId, order_id: orderId ?? null, subject: subject ?? null })
    .select('id').single()

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })
  return NextResponse.json({ id: (created as any).id }, { status: 201 })
}
