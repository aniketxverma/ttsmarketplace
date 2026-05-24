import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/channels/[id]/posts — get posts (paginated, newest first)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const url    = new URL(req.url)
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50)

  const { data: posts } = await (supabase.from('channel_posts') as any)
    .select('*')
    .eq('channel_id', params.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return NextResponse.json({ posts: posts ?? [] })
}

// POST /api/channels/[id]/posts — supplier creates a broadcast post
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { content, image_url, post_type = 'update' } = body
  if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const VALID_TYPES = ['update', 'offer', 'product', 'announcement']
  if (!VALID_TYPES.includes(post_type)) return NextResponse.json({ error: 'Invalid post type' }, { status: 400 })

  const { data: post, error } = await (supabase.from('channel_posts') as any)
    .insert({
      channel_id: params.id,
      content:    content.trim(),
      image_url:  image_url?.trim() || null,
      post_type,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ post }, { status: 201 })
}
