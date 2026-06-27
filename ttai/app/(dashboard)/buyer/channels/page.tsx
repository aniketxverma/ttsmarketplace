import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { requireAuth } from '@/lib/auth/rbac'
import Link from 'next/link'
import { Radio, ArrowRight } from 'lucide-react'
import { ChannelsInbox, type InboxChannel } from './ChannelsInbox'

export const revalidate = 0

export default async function BuyerChannelsPage() {
  
  const tt = await localizeUI(["No canales yet", "Subscribe", "to follow their updates here — like a WhatsApp channel.", "Explore Marketplace"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  // Joined channels
  const { data: memberships } = await (supabase.from('channel_members') as any)
    .select(`
      joined_at,
      supplier_channels (
        id, name, description, whatsapp, member_count, post_count,
        suppliers ( trade_name, legal_name, logo_url, brand_slug )
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const joined = (memberships ?? []).map((m: any) => ({
    joined_at: m.joined_at,
    ...m.supplier_channels,
    supplier: m.supplier_channels?.suppliers ?? null,
  })).filter((c: any) => c?.id)

  // Latest post per channel (for list preview) + sort channels by latest activity
  const channelIds = joined.map((ch: any) => ch.id)
  const latestByChannel: Record<string, any> = {}
  if (channelIds.length > 0) {
    const { data: recent } = await (supabase.from('channel_posts') as any)
      .select('*')
      .in('channel_id', channelIds)
      .order('created_at', { ascending: false })
      .limit(channelIds.length * 6)
    for (const p of (recent ?? [])) {
      if (!latestByChannel[p.channel_id]) latestByChannel[p.channel_id] = p
    }
  }

  const channels: InboxChannel[] = joined
    .map((ch: any) => ({
      id: ch.id, name: ch.name, description: ch.description, whatsapp: ch.whatsapp,
      member_count: ch.member_count ?? 0, post_count: ch.post_count ?? 0, joined_at: ch.joined_at,
      supplier: ch.supplier,
      latest: latestByChannel[ch.id] ?? null,
    }))
    .sort((a: InboxChannel, b: InboxChannel) => {
      const ta = a.latest ? new Date(a.latest.created_at).getTime() : new Date(a.joined_at).getTime()
      const tb = b.latest ? new Date(b.latest.created_at).getTime() : new Date(b.joined_at).getTime()
      return tb - ta
    })

  // Empty state — no subscriptions yet
  if (channels.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-extrabold text-gray-700 mb-1">{tt("No canales yet")}</h3>
          <p className="text-sm text-gray-400 mb-6">
            Visit a supplier&apos;s brand page and tap <strong>{tt("Subscribe")}</strong> {tt("to follow their updates here — like a WhatsApp channel.")}
          </p>
          <Link href="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0B1F4D] text-white rounded-xl text-sm font-bold hover:bg-[#162d6e] transition-colors shadow-sm">
            {tt("Explore Marketplace")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return <ChannelsInbox channels={channels} />
}
