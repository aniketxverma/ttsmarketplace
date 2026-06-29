import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUS = ['official', 'importer', 'exclusive', 'retail', 'agent', 'office', 'coming_soon']
const str = (v: any, max: number) => (v == null ? '' : String(v)).slice(0, max)

/** Save the signed-in supplier's Global Distribution Network config. */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

  const admin = createAdminClient()
  const { data: sup } = await (admin.from('suppliers') as any).select('id').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile found' }, { status: 404 })

  const body = await req.json().catch(() => null) as any
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const nodes = (Array.isArray(body.nodes) ? body.nodes : []).slice(0, 40).map((n: any) => {
    const out: any = {
      iso: str(n.iso, 2).toUpperCase(),
      country: str(n.country, 60),
      status: VALID_STATUS.includes(n.status) ? n.status : 'office',
      verified: !!n.verified,
    }
    if (n.company) out.company = str(n.company, 120)
    if (n.profile) out.profile = str(n.profile, 200)
    const benefits = Array.isArray(n.benefits) ? n.benefits.map((b: any) => str(b, 80)).filter(Boolean).slice(0, 8) : []
    if (benefits.length) out.benefits = benefits
    return out
  }).filter((n: any) => n.country && n.iso)

  const center = {
    title: str(body.center?.title, 80) || 'Head Office / Factory',
    subtitle: str(body.center?.subtitle, 80),
    iso: str(body.center?.iso, 2).toUpperCase(),
    since: str(body.center?.since, 40) || null,
    image: str(body.center?.image, 500) || null,
  }

  const key = `dist_network:${sup.id}`
  if (!nodes.length) {
    // Clearing the network removes the circle from the profile/preview.
    await (admin.from('app_settings') as any).delete().eq('key', key)
    return NextResponse.json({ ok: true, cleared: true })
  }
  await (admin.from('app_settings') as any).upsert({ key, value: JSON.stringify({ center, nodes }) }, { onConflict: 'key' })
  return NextResponse.json({ ok: true, nodes: nodes.length })
}
