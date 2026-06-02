import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `channel-posts/${user.id}-${Date.now()}.${ext}`

  const admin = createAdminClient()
  const { error: uploadErr } = await admin.storage
    .from('brand-assets')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = admin.storage.from('brand-assets').getPublicUrl(path)
  return NextResponse.json({ url: urlData.publicUrl })
}
