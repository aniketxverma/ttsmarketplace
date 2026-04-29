import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (s: ReturnType<typeof createClient>) => s as any

async function isParticipant(supabase: ReturnType<typeof createClient>, convId: string, userId: string) {
  const { data: asBuyer } = await db(supabase)
    .from('conversations').select('id').eq('id', convId).eq('buyer_id', userId).maybeSingle()
  if (asBuyer) return true

  const { data: conv } = await db(supabase)
    .from('conversations').select('supplier_id').eq('id', convId).single()
  if (!conv) return false

  const { data: supplier } = await supabase
    .from('suppliers').select('id')
    .eq('id', (conv as any).supplier_id).eq('owner_id', userId).maybeSingle()
  return !!supplier
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!await isParticipant(supabase, params.id, user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await db(supabase)
    .from('messages')
    .select('id, body, sender_id, is_read, created_at, profiles!sender_id(full_name)')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!await isParticipant(supabase, params.id, user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const { data: msg, error } = await db(supabase)
    .from('messages')
    .insert({ conversation_id: params.id, sender_id: user.id, body: body.trim() })
    .select('id, body, sender_id, is_read, created_at')
    .single()

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  await db(supabase)
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json(msg, { status: 201 })
}
