import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Delete a user's temporary uploaded import file from storage. */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storagePath } = await req.json().catch(() => ({})) as { storagePath?: string }
  if (!storagePath || !storagePath.startsWith(`imports/${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  const admin = createAdminClient()
  await admin.storage.from('brand-assets').remove([storagePath])
  return NextResponse.json({ ok: true })
}
