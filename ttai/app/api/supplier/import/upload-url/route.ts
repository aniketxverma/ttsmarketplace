import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Issues a signed upload URL so the browser can send a large .xlsx straight to
 * storage (bypassing the API request-body limit). The file lands under the
 * user's own import folder; the parse endpoint later reads it back server-side.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename } = await req.json().catch(() => ({})) as { filename?: string }
  const safe = String(filename || 'import.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
  const path = `imports/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from('brand-assets').createSignedUploadUrl(path)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ path: data.path, token: data.token })
}
