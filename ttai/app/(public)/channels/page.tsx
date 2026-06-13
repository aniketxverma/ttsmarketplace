import { createClient } from '@/lib/supabase/server'
import { tierRank } from '@/lib/business-chain'
import { ChannelsDiscovery, type DiscoveryChannel, type FeedPost, type GroupItem } from './ChannelsDiscovery'

export const revalidate = 30

export const metadata = {
  title: 'Canales — Supplier Offers, Channels & WhatsApp Groups · TTAI EMA',
  description: 'A live feed of supplier offers, channels (canales) and WhatsApp groups — exclusive deals, product drops and trade updates, organised by category.',
}

export default async function ChannelsPage() {
  const supabase = createClient()

  // Active channels + supplier (incl. owner_id so we can flag paying suppliers)
  const { data: channelsRaw } = await (supabase.from('supplier_channels') as any)
    .select(`
      id, name, description, whatsapp, member_count, post_count, supplier_id,
      suppliers ( id, trade_name, legal_name, logo_url, brand_slug, reliability_tier, owner_id )
    `)
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(60)

  const channels = (channelsRaw ?? []) as any[]
  const supplierIds = channels.map(c => c.supplier_id).filter(Boolean)

  // Paying suppliers: map each supplier's owner → profiles.tier (paid = tier ≥ standard)
  const paidBySupplier: Record<string, boolean> = {}
  const ownerIds = channels.map(c => (c.suppliers as any)?.owner_id).filter(Boolean)
  if (ownerIds.length > 0) {
    const { data: profs } = await (supabase.from('profiles') as any).select('id, tier').in('id', ownerIds)
    const tierByOwner: Record<string, string> = Object.fromEntries(((profs ?? []) as any[]).map(p => [p.id, p.tier]))
    for (const c of channels) {
      const owner = (c.suppliers as any)?.owner_id
      paidBySupplier[c.supplier_id] = owner ? tierRank(tierByOwner[owner]) >= 1 : false
    }
  }

  // Derive a primary category per supplier from their published products + collect posts
  const categoryBySupplier: Record<string, string> = {}
  const latestByChannel: Record<string, any> = {}
  let allPosts: any[] = []
  if (supplierIds.length > 0) {
    const channelIds = channels.map(c => c.id)
    const [prodRes, postRes] = await Promise.all([
      supabase.from('products')
        .select('supplier_id, categories(name)')
        .in('supplier_id', supplierIds)
        .eq('is_published', true),
      (supabase.from('channel_posts') as any)
        .select('id, channel_id, content, image_url, post_type, created_at')
        .in('channel_id', channelIds)
        .order('created_at', { ascending: false })
        .limit(60),
    ])

    const tally: Record<string, Record<string, number>> = {}
    for (const row of (prodRes.data ?? []) as any[]) {
      const cat = (row.categories as any)?.name
      if (!cat) continue
      tally[row.supplier_id] ??= {}
      tally[row.supplier_id][cat] = (tally[row.supplier_id][cat] ?? 0) + 1
    }
    for (const [sid, cats] of Object.entries(tally)) {
      categoryBySupplier[sid] = Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0]
    }

    allPosts = (postRes.data ?? []) as any[]
    for (const p of allPosts) if (!latestByChannel[p.channel_id]) latestByChannel[p.channel_id] = p
  }

  // Channel lookup for the feed
  const channelById: Record<string, any> = Object.fromEntries(channels.map(c => [c.id, c]))

  const list: DiscoveryChannel[] = channels.map((c) => {
    const sup = c.suppliers as any
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      member_count: c.member_count ?? 0,
      post_count: c.post_count ?? 0,
      category: categoryBySupplier[c.supplier_id] ?? 'General',
      paid: paidBySupplier[c.supplier_id] ?? false,
      supplier: sup ? {
        trade_name: sup.trade_name, legal_name: sup.legal_name,
        logo_url: sup.logo_url, brand_slug: sup.brand_slug, reliability_tier: sup.reliability_tier,
      } : null,
      latest: latestByChannel[c.id] ?? null,
    }
  })
  // Paying suppliers first, then by subscribers.
  list.sort((a, b) => (Number(b.paid) - Number(a.paid)) || (b.member_count - a.member_count))

  // Offers feed — latest posts across all channels, paying suppliers boosted.
  const feed: FeedPost[] = allPosts.slice(0, 40).map((p) => {
    const c = channelById[p.channel_id]
    const sup = c?.suppliers as any
    return {
      id: p.id,
      channel_id: p.channel_id,
      channel_name: c?.name ?? 'Canal',
      content: p.content,
      image_url: p.image_url,
      post_type: p.post_type,
      created_at: p.created_at,
      category: categoryBySupplier[c?.supplier_id] ?? 'General',
      paid: paidBySupplier[c?.supplier_id] ?? false,
      supplier: sup ? { trade_name: sup.trade_name, legal_name: sup.legal_name, logo_url: sup.logo_url } : null,
    }
  })
  feed.sort((a, b) => (Number(b.paid) - Number(a.paid)) || (+new Date(b.created_at) - +new Date(a.created_at)))

  // WhatsApp groups directory (table may not exist yet → defensive).
  let groups: GroupItem[] = []
  try {
    const { data: groupsRaw } = await (supabase.from('whatsapp_groups') as any)
      .select(`id, name, description, category, invite_link, member_count, supplier_id,
        suppliers ( trade_name, legal_name, logo_url, brand_slug, owner_id )`)
      .eq('is_active', true)
      .limit(60)
    groups = ((groupsRaw ?? []) as any[]).map((g) => {
      const sup = g.suppliers as any
      return {
        id: g.id, name: g.name, description: g.description,
        category: g.category ?? 'General', invite_link: g.invite_link,
        member_count: g.member_count ?? 0,
        paid: paidBySupplier[g.supplier_id] ?? (sup?.owner_id ? false : false),
        supplier: sup ? { trade_name: sup.trade_name, legal_name: sup.legal_name, logo_url: sup.logo_url, brand_slug: sup.brand_slug } : null,
      }
    })
    groups.sort((a, b) => (Number(b.paid) - Number(a.paid)) || (b.member_count - a.member_count))
  } catch { groups = [] }

  return <ChannelsDiscovery channels={list} feed={feed} groups={groups} />
}
