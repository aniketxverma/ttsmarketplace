import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/channels/[id]/posts/[postId] — supplier deletes a post
export async function DELETE(
  _: Request,
  { params }: { params: { id: string; postId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await (supabase.from('channel_posts') as any)
    .delete()
    .eq('id', params.postId)
    .eq('channel_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ deleted: true })
}
