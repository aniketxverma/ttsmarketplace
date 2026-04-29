import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await (supabase as any)
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', params.id)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ ok: true })
}
