import { createClient } from '@/lib/supabase/server'
import { tierRank } from '@/lib/business-chain'
import { WhatsAppHub, type HubChannel, type HubGroup, type HubActivity } from './WhatsAppHub'

export const revalidate = 30
export const metadata = {
  title: 'WhatsApp Hub — Channels & Trading Groups · TTAI EMA',
  description: 'Connect with real supplier offers, channels and WhatsApp trading groups — negotiate and grow with the TTAI EMA global community.',
}

export default async function WhatsAppHubPage() {
  const supabase = createClient()

  const { data: channelsRaw } = await (supabase.from('supplier_channels') as any)
    .select(`id, name, description, member_count, post_count, supplier_id,
      suppliers ( id, trade_name, legal_name, logo_url, brand_slug, reliability_tier, owner_id )`)
    .eq('is_active', true).order('member_count', { ascending: false }).limit(40)
  const channels = (channelsRaw ?? []) as any[]
  const channelIds = channels.map((c) => c.id)
  const supplierIds = channels.map((c) => c.supplier_id).filter(Boolean)

  // Latest posts (offers) across all channels.
  const posts = channelIds.length
    ? (((await (supabase.from('channel_posts') as any).select('*').in('channel_id', channelIds)
        .order('created_at', { ascending: false }).limit(150)).data) ?? []) as any[]
    : []

  // Paying suppliers → verified badge.
  const ownerIds = channels.map((c) => (c.suppliers as any)?.owner_id).filter(Boolean)
  const paidByChannel: Record<string, boolean> = {}
  if (ownerIds.length) {
    const { data: profs } = await (supabase.from('profiles') as any).select('id, tier').in('id', ownerIds)
    const tierByOwner: Record<string, string> = Object.fromEntries(((profs ?? []) as any[]).map((p) => [p.id, p.tier]))
    for (const c of channels) {
      const o = (c.suppliers as any)?.owner_id
      paidByChannel[c.id] = o ? tierRank(tierByOwner[o]) >= 1 : false
    }
  }

  // Derive a category per channel from the supplier's published products.
  const categoryByChannel: Record<string, string> = {}
  if (supplierIds.length) {
    const { data: prod } = await supabase.from('products').select('supplier_id, categories(name)').in('supplier_id', supplierIds).eq('is_published', true)
    const tally: Record<string, Record<string, number>> = {}
    for (const r of (prod ?? []) as any[]) {
      const cat = (r.categories as any)?.name
      if (!cat) continue
      ;(tally[r.supplier_id] ||= {})[cat] = ((tally[r.supplier_id] ||= {})[cat] ?? 0) + 1
    }
    const topBySupplier: Record<string, string> = {}
    for (const [sid, cats] of Object.entries(tally)) topBySupplier[sid] = Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0]
    for (const c of channels) categoryByChannel[c.id] = topBySupplier[c.supplier_id] ?? 'General'
  }

  const postsByChannel: Record<string, any[]> = {}
  for (const p of posts) (postsByChannel[p.channel_id] ||= []).push(p)

  const channelData: HubChannel[] = channels.map((c) => {
    const sup = c.suppliers as any
    return {
      id: c.id, name: c.name,
      supplier: sup?.trade_name ?? sup?.legal_name ?? 'Supplier',
      logo: sup?.logo_url ?? null,
      followers: c.member_count ?? 0,
      verified: paidByChannel[c.id] ?? false,
      category: categoryByChannel[c.id] ?? 'General',
      offers: (postsByChannel[c.id] ?? []).slice(0, 2).map((p) => ({
        content: p.content, image: p.image_url ?? null, video: !!p.video_url,
        type: p.post_type, created_at: p.created_at,
      })),
    }
  })
  channelData.sort((a, b) => (Number(b.verified) - Number(a.verified)) || (b.followers - a.followers))

  // WhatsApp groups directory.
  let groups: HubGroup[] = []
  try {
    const { data } = await (supabase.from('whatsapp_groups') as any)
      .select('*').eq('is_active', true).order('member_count', { ascending: false }).limit(60)
    groups = ((data ?? []) as any[]).map((g) => ({
      id: g.id, name: g.name, description: g.description ?? null,
      category: g.category ?? 'General', region: g.region ?? null,
      invite: g.invite_link, members: g.member_count ?? 0,
    }))
  } catch { groups = [] }

  const { data: catsRaw } = await supabase.from('categories').select('name').is('parent_id', null).order('sort_order').limit(14)
  const categories = ((catsRaw ?? []) as any[]).map((c) => c.name)

  const channelName: Record<string, string> = Object.fromEntries(channels.map((c) => [c.id, c.name]))
  const activity: HubActivity[] = posts.slice(0, 8).map((p) => ({
    channel: channelName[p.channel_id] ?? 'Channel', channelId: p.channel_id,
    content: p.content, type: p.post_type, created_at: p.created_at,
  }))

  const members = channels.reduce((s, c) => s + (c.member_count ?? 0), 0) + groups.reduce((s, g) => s + g.members, 0)
  const stats = { channels: channels.length, groups: groups.length, members }

  return <WhatsAppHub stats={stats} categories={categories} channels={channelData} groups={groups} activity={activity} />
}
