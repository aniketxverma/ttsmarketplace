import { createClient } from '@/lib/supabase/server'
import { ChannelsDiscovery, type DiscoveryChannel } from './ChannelsDiscovery'

export const revalidate = 30

export const metadata = {
  title: 'Canales — Follow Supplier Channels · TTAI EMA',
  description: 'Discover and subscribe to supplier channels (canales) for exclusive offers, product drops and trade updates — organised by category.',
}

export default async function ChannelsPage() {
  const supabase = createClient()

  // Active channels + supplier
  const { data: channelsRaw } = await (supabase.from('supplier_channels') as any)
    .select(`
      id, name, description, whatsapp, member_count, post_count, supplier_id,
      suppliers ( id, trade_name, legal_name, logo_url, brand_slug, reliability_tier )
    `)
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(60)

  const channels = (channelsRaw ?? []) as any[]
  const supplierIds = channels.map(c => c.supplier_id).filter(Boolean)

  // Derive a primary category per supplier from their published products
  const categoryBySupplier: Record<string, string> = {}
  const latestByChannel: Record<string, any> = {}
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
        .limit(channelIds.length * 4),
    ])

    // most common category per supplier
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

    for (const p of (postRes.data ?? [])) {
      if (!latestByChannel[p.channel_id]) latestByChannel[p.channel_id] = p
    }
  }

  const list: DiscoveryChannel[] = channels.map((c) => {
    const sup = c.suppliers as any
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      member_count: c.member_count ?? 0,
      post_count: c.post_count ?? 0,
      category: categoryBySupplier[c.supplier_id] ?? 'General',
      supplier: sup ? {
        trade_name: sup.trade_name, legal_name: sup.legal_name,
        logo_url: sup.logo_url, brand_slug: sup.brand_slug, reliability_tier: sup.reliability_tier,
      } : null,
      latest: latestByChannel[c.id] ?? null,
    }
  })

  return <ChannelsDiscovery channels={list} />
}
