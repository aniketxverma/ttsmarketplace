import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Users, Bell, Tag, Package, Megaphone } from 'lucide-react'
import { ChannelJoinButton } from './ChannelJoinButton'

export const revalidate = 30

// ── Post type config ──────────────────────────────────────────────────────────
const POST_TYPES: Record<string, {
  label: string
  badge: string
  bar: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-500',   Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-500',  Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700',bar: 'bg-purple-500', Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700',  bar: 'bg-green-500',  Icon: Megaphone },
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await (supabase.from('supplier_channels') as any)
    .select('name, description, suppliers(trade_name)')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()
  if (!data) return {}
  const supplier = data.suppliers as any
  return {
    title: `${data.name} — ${supplier?.trade_name ?? 'Supplier'} Canal · TTAI`,
    description: data.description ?? `Subscribe to ${data.name} for exclusive updates and offers.`,
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return d.toLocaleDateString('en', { weekday: 'short' })
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: channel } = await (supabase.from('supplier_channels') as any)
    .select('*, suppliers(id, trade_name, legal_name, logo_url, brand_slug)')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!channel) notFound()

  const { data: postsData } = await (supabase.from('channel_posts') as any)
    .select('*')
    .eq('channel_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const supplier = channel.suppliers as any
  const posts    = (postsData ?? []) as any[]
  const initial  = channel.name[0]?.toUpperCase() ?? 'C'

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0B1F4D] shadow-lg">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          {supplier?.brand_slug ? (
            <Link href={`/brand/${supplier.brand_slug}`}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <Link href="/marketplace"
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          {/* Small logo */}
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white/10">
            {supplier?.logo_url ? (
              <Image src={supplier.logo_url} alt={supplier.trade_name ?? ''} width={36} height={36}
                className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">{initial}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-extrabold text-sm leading-tight truncate">{channel.name}</h1>
            <p className="text-white/50 text-[11px]">{channel.member_count.toLocaleString()} subscribers</p>
          </div>
        </div>
      </div>

      {/* ── Channel info card ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-8 text-center">
          {/* Large logo */}
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white shadow-lg bg-[#0B1F4D]">
            {supplier?.logo_url ? (
              <Image src={supplier.logo_url} alt={supplier.trade_name ?? ''} width={80} height={80}
                className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-extrabold text-3xl">{initial}</span>
              </div>
            )}
          </div>

          <h2 className="text-xl font-extrabold text-[#0B1F4D] leading-tight">{channel.name}</h2>
          {supplier?.trade_name && (
            <p className="text-sm text-gray-500 mt-0.5 font-medium">by {supplier.trade_name}</p>
          )}
          {channel.description && (
            <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto leading-relaxed">{channel.description}</p>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-4 mb-6">
            <div className="text-center">
              <p className="text-xl font-extrabold text-[#0B1F4D]">{channel.member_count.toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Subscribers</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-xl font-extrabold text-[#0B1F4D]">{channel.post_count.toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Posts</p>
            </div>
          </div>

          {/* Join button */}
          <ChannelJoinButton channelId={channel.id} whatsapp={channel.whatsapp} />
        </div>
      </div>

      {/* ── Posts feed ────────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-3 py-4 pb-10">

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center mt-2 shadow-sm border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-sm">No posts yet</p>
            <p className="text-gray-400 text-xs mt-1">Subscribe to be the first to know when they post.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {/* "Updates" label */}
            <div className="flex items-center gap-3 py-2 px-2">
              <div className="h-px flex-1 bg-gray-300/60" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Latest Updates</span>
              <div className="h-px flex-1 bg-gray-300/60" />
            </div>

            {posts.map((post: any, idx: number) => {
              const typeCfg  = POST_TYPES[post.post_type] ?? POST_TYPES.update
              const TypeIcon = typeCfg.Icon

              // Show date divider when date changes
              const postDate = new Date(post.created_at).toDateString()
              const prevDate = idx < posts.length - 1
                ? new Date(posts[idx + 1].created_at).toDateString()
                : null
              const showDateDivider = prevDate && postDate !== prevDate

              return (
                <div key={post.id}>
                  {/* Post bubble */}
                  <div className="flex items-start gap-2.5">
                    {/* Small supplier avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5 border border-white shadow-sm bg-[#0B1F4D]">
                      {supplier?.logo_url ? (
                        <Image src={supplier.logo_url} alt="" width={32} height={32}
                          className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-[10px]">{initial}</span>
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="flex-1 bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden max-w-[calc(100%-3rem)]">
                      {/* Type accent bar */}
                      <div className={`h-0.5 ${typeCfg.bar}`} />

                      {/* Image (above text for visual impact) */}
                      {post.image_url && (
                        <img src={post.image_url} alt=""
                          className="w-full object-cover max-h-80" />
                      )}

                      {/* Content area */}
                      <div className="px-4 pt-3 pb-3">
                        {/* Sender + type badge row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-extrabold text-[#0B1F4D] leading-none truncate">
                            {supplier?.trade_name ?? channel.name}
                          </p>
                          <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${typeCfg.badge}`}>
                            <TypeIcon className="w-2.5 h-2.5" />
                            {typeCfg.label}
                          </span>
                        </div>

                        {/* Text */}
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>

                        {/* Timestamp */}
                        <p className="text-[10px] text-gray-400 mt-2 text-right">{formatTime(post.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date divider */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-gray-200/80 text-gray-500 text-[10px] font-semibold px-3 py-1 rounded-full">
                        {formatFullDate(posts[idx + 1].created_at)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Bottom — link back to brand */}
            {supplier?.brand_slug && (
              <div className="pt-6 text-center">
                <Link href={`/brand/${supplier.brand_slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0B1F4D] hover:underline">
                  Visit {supplier.trade_name ?? ''} brand store
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
