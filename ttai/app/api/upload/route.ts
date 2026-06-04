import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Generic authenticated image upload → public `brand-assets` bucket.
 * POST multipart { file, folder? } → { url }.
 *
 * Uses the admin client so it works regardless of storage RLS, but only for a
 * logged-in user and only into a per-user path.
 */
const FOLDERS = ['products', 'logos', 'banners', 'gallery', 'misc']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const folderRaw = (form.get('folder') as string | null) ?? 'misc'
  const folder = FOLDERS.includes(folderRaw) ? folderRaw : 'misc'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })

  const ext  = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `${folder}/${user.id}/${Date.now()}-${rand}.${ext}`

  const admin = createAdminClient()
  const { error: upErr } = await admin.storage
    .from('brand-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data } = admin.storage.from('brand-assets').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
