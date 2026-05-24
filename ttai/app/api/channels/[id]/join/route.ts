import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/channels/[id]/join — authenticated user joins a channel
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await (supabase.from('channel_members') as any)
    .insert({ channel_id: params.id, user_id: user.id })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ joined: true }) // already a member
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ joined: true }, { status: 201 })
}

// DELETE /api/channels/[id]/join — authenticated user leaves a channel
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await (supabase.from('channel_members') as any)
    .delete()
    .eq('channel_id', params.id)
    .eq('user_id', user.id)

  return NextResponse.json({ left: true })
}
