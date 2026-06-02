import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Bell, Tag, Package, Megaphone } from 'lucide-react'
import { ChannelJoinButton } from './ChannelJoinButton'

export const revalidate = 30

// ── Post type config ──────────────────────────────────────────────────────────
const POST_TYPES: Record<string, {
  label: string; badge: string; bar: string
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
    .eq('id', params.id).eq('is_active', true).single()
  if (!data) return {}
  const s = data.suppliers as any
  return {
    title: `${data.name} — ${s?.trade_name ?? 'Supplier'} Canal · TTAI`,
    description: data.description ?? `Subscribe to ${data.name} for exclusive updates.`,
  }
}

function fmtTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = new Date(iso)
  if (diff < 7 * 86400000) return d.toLocaleDateString('en', { weekday: 'short' })
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

function fmtDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: channel } = await (supabase.from('supplier_channels') as any)
    .select('*, suppliers(id, trade_name, legal_name, logo_url, brand_slug)')
    .eq('id', params.id).eq('is_active', true).single()

  if (!channel) notFound()

  const { data: postsData } = await (supabase.from('channel_posts') as any)
    .select('*').eq('channel_id', params.id)
    .order('created_at', { ascending: false }).limit(50)

  const supplier = channel.suppliers as any
  const posts    = (postsData ?? []) as any[]
  const initial  = channel.name[0]?.toUpperCase() ?? 'C'

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0B1F4D] shadow-md">
        <div className="max-w-2xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-3">
          <Link
            href={supplier?.brand_slug ? `/brand/${supplier.brand_slug}` : '/marketplace'}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white/10">
            {supplier?.logo_url ? (
              <Image src={supplier.logo_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-extrabold text-xs">{initial}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-extrabold text-sm leading-tight truncate">{channel.name}</h1>
            <p className="text-white/50 text-[11px]">{channel.member_count.toLocaleString()} subscribers</p>
          </div>

          {/* Mini subscribe pill in header */}
          <div className="flex-shrink-0">
            <ChannelJoinButton channelId={channel.id} whatsapp={channel.whatsapp} compact />
          </div>
        </div>
      </div>

      {/* ── Channel info card ─────────────────────────────────────────── */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            {/* Logo */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-[#0B1F4D] flex items-center justify-center">
                {supplier?.logo_url ? (
                  <Image src={supplier.logo_url} alt="" width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-white font-extrabold text-4xl">{initial}</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4D]">{channel.name}</h2>
              {supplier?.trade_name && (
                <p className="text-sm text-gray-500 font-medium mt-0.5">by {supplier.trade_name}</p>
              )}
              {channel.description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-md mx-auto sm:mx-0">
                  {channel.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mt-3">
                <div className="text-center sm:text-left">
                  <p className="text-lg font-extrabold text-[#0B1F4D]">{channel.member_count.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Subscribers</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center sm:text-left">
                  <p className="text-lg font-extrabold text-[#0B1F4D]">{channel.post_count.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Posts</p>
                </div>
              </div>

              {/* Subscribe button — full size (below stats) */}
              <div className="mt-5 flex justify-center sm:justify-start">
                <ChannelJoinButton channelId={channel.id} whatsapp={channel.whatsapp} compact={false} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Posts feed ────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-12">

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
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-gray-300/50" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Updates</span>
              <div className="h-px flex-1 bg-gray-300/50" />
            </div>

            {posts.map((post: any, idx: number) => {
              const cfg      = POST_TYPES[post.post_type] ?? POST_TYPES.update
              const TypeIcon = cfg.Icon
              const postDay  = new Date(post.created_at).toDateString()
              const prevDay  = idx < posts.length - 1 ? new Date(posts[idx + 1].created_at).toDateString() : null
              const showDivider = prevDay && postDay !== prevDay

              return (
                <div key={post.id}>
                  {/* Post bubble */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Avatar */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5 border border-white shadow-sm bg-[#0B1F4D]">
                      {supplier?.logo_url ? (
                        <Image src={supplier.logo_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-[9px]">{initial}</span>
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                      {/* Top accent bar */}
                      <div className={`h-0.5 ${cfg.bar}`} />

                      {/* Image — full width above text */}
                      {post.image_url && (
                        <img src={post.image_url} alt=""
                          className="w-full object-cover max-h-[280px] sm:max-h-80" />
                      )}

                      {/* Text content */}
                      <div className="px-3 sm:px-4 pt-2.5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-xs font-extrabold text-[#0B1F4D] truncate">
                            {supplier?.trade_name ?? channel.name}
                          </p>
                          <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
                            <TypeIcon className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`sm:hidden flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            <TypeIcon className="w-2.5 h-2.5" />{cfg.label}
                          </span>
                          <p className="text-[10px] text-gray-400 ml-auto">{fmtTime(post.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date divider */}
                  {showDivider && (
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-gray-200/80 text-gray-500 text-[10px] font-semibold px-3 py-1 rounded-full">
                        {fmtDay(posts[idx + 1].created_at)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {supplier?.brand_slug && (
              <div className="pt-5 text-center">
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
