import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import Link from 'next/link'
import Image from 'next/image'
import { Radio, Users, ArrowRight, Bell, Tag, Package, Megaphone } from 'lucide-react'

export const revalidate = 0

const POST_TYPE_BADGE: Record<string, { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',    Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700',  Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700',Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700',  Icon: Megaphone },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

export default async function BuyerChannelsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  // Get all joined channels
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
    supplier: m.supplier_channels?.suppliers,
  })).filter(Boolean)

  // Fetch latest post per channel (batch query)
  const channelIds = joined.map((ch: any) => ch.id)
  const latestPostByChannel: Record<string, any> = {}
  if (channelIds.length > 0) {
    const { data: recentPosts } = await (supabase.from('channel_posts') as any)
      .select('id, channel_id, content, image_url, post_type, created_at')
      .in('channel_id', channelIds)
      .order('created_at', { ascending: false })
      .limit(channelIds.length * 5)
    for (const p of (recentPosts ?? [])) {
      if (!latestPostByChannel[p.channel_id]) latestPostByChannel[p.channel_id] = p
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D]">My Canales</h1>
          <p className="text-sm text-gray-400 mt-0.5">Channels you follow for updates and exclusive offers</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0B1F4D]/8 rounded-2xl px-4 py-2.5">
          <Radio className="w-4 h-4 text-[#0B1F4D]" />
          <span className="text-sm font-extrabold text-[#0B1F4D]">{joined.length} subscribed</span>
        </div>
      </div>

      {/* Empty state */}
      {joined.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-extrabold text-gray-700 mb-1">No canales yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Visit a supplier&apos;s brand page and tap &quot;Subscribe&quot; to start receiving their exclusive updates.
          </p>
          <Link href="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0B1F4D] text-white rounded-xl text-sm font-bold hover:bg-[#162d6e] transition-colors shadow-sm">
            Explore Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Channel cards */}
      {joined.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {joined.map((ch: any) => {
            const latest  = latestPostByChannel[ch.id]
            const typeCfg = latest ? (POST_TYPE_BADGE[latest.post_type] ?? POST_TYPE_BADGE.update) : null
            const TypeIcon = typeCfg?.Icon

            return (
              <div key={ch.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">

                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-[#0B1F4D] to-purple-600" />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Supplier info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-[#0B1F4D] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm border-2 border-white">
                      {ch.supplier?.logo_url ? (
                        <Image src={ch.supplier.logo_url} alt={ch.supplier.trade_name ?? ''} width={44} height={44}
                          className="object-cover w-full h-full" />
                      ) : (
                        <Radio className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        {ch.supplier?.trade_name ?? ch.supplier?.legal_name ?? 'Supplier'}
                      </p>
                      <h3 className="text-sm font-extrabold text-gray-900 truncate">{ch.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 flex-shrink-0">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500">{ch.member_count.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Latest post preview */}
                  {latest ? (
                    <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 p-3 mb-4 overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {TypeIcon && typeCfg && (
                          <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${typeCfg.badge}`}>
                            <TypeIcon className="w-2.5 h-2.5" />{typeCfg.label}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(latest.created_at)}</span>
                      </div>
                      {latest.image_url && (
                        <img src={latest.image_url} alt="" className="w-full rounded-lg object-cover max-h-24 mb-2" />
                      )}
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{latest.content}</p>
                    </div>
                  ) : ch.description ? (
                    <p className="flex-1 text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">{ch.description}</p>
                  ) : (
                    <p className="flex-1 text-xs text-gray-300 italic mb-4">No posts yet</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/channel/${ch.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0B1F4D] hover:bg-[#162d6e] text-white rounded-xl text-xs font-bold transition-colors">
                      <Radio className="w-3.5 h-3.5" />Open Canal
                    </Link>
                    {ch.supplier?.brand_slug && (
                      <Link href={`/brand/${ch.supplier.brand_slug}`}
                        className="flex items-center justify-center px-3 py-2.5 border border-gray-200 text-gray-500 hover:border-[#0B1F4D] hover:text-[#0B1F4D] rounded-xl text-xs font-bold transition-all">
                        Brand
                      </Link>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-300 mt-3">
                    Subscribed {new Date(ch.joined_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Discover more */}
      {joined.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="font-extrabold text-[#0B1F4D] text-sm">Discover more canales</p>
            <p className="text-xs text-gray-400 mt-0.5">Browse suppliers and subscribe to their official channels</p>
          </div>
          <Link href="/marketplace"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1F4D] text-white rounded-xl text-sm font-bold hover:bg-[#162d6e] transition-colors flex-shrink-0">
            Explore <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
