import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireRole('admin')
  const supabase = createClient()
  const { notes } = await request.json()

  const { error } = await supabase
    .from('suppliers')
    .update({ admin_notes: notes })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
