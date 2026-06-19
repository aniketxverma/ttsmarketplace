import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Bell, Tag, Package, Megaphone, Search, MoreVertical } from 'lucide-react'
import { ChannelJoinButton } from './ChannelJoinButton'
import { PostImage } from '@/components/channels/PostImage'

export const revalidate = 30

// WhatsApp-style doodle wallpaper (faint shapes on beige).
const DOODLE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cg fill='none' stroke='%239aa6a0' stroke-width='1' opacity='0.22'%3E%3Cpath d='M10 16c2-3 7-3 9 0'/%3E%3Ccircle cx='74' cy='14' r='4'/%3E%3Cpath d='M16 66l4-7 4 7z'/%3E%3Cpath d='M64 72c-3-3-1-7 4-5 4-2 6 2 3 5l-3 3z'/%3E%3Cpath d='M42 44h9M46 40v9'/%3E%3Cpath d='M80 50c0 3-2 5-5 5'/%3E%3Cpath d='M10 44c3 2 6 2 9 0'/%3E%3Crect x='56' y='34' width='8' height='8' rx='2'/%3E%3Cpath d='M84 80c2-3 6-3 8 0'/%3E%3Ccircle cx='30' cy='84' r='4'/%3E%3C/g%3E%3C/svg%3E\")"

// ── Post type config (small WhatsApp-style label) ──────────────────────────────
const POST_TYPES: Record<string, {
  label: string; badge: string; color: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  update:       { label: 'Update',       badge: 'bg-blue-50 text-blue-600',    color: '#1f7aec', Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-50 text-amber-700',  color: '#c77700', Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-50 text-purple-700',color: '#7c3aed', Icon: Package   },
  announcement: { label: 'Announcement', badge: 'bg-green-50 text-green-700',  color: '#1f9d55', Icon: Megaphone },
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await (supabase.from('supplier_channels') as any)
    .select('name, description, suppliers(trade_name)')
    .eq('id', params.id).eq('is_active', true).single()
  if (!data) return {}
  const s = data.suppliers as any
  return {
    title: `${data.name} — ${s?.trade_name ?? 'Supplier'} Channel · TTAI`,
    description: data.description ?? `Follow ${data.name} for exclusive updates.`,
  }
}

/** WhatsApp shows the clock time on each message (e.g. 20:11). */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'TODAY'
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'YESTERDAY'
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
    <div className="min-h-screen flex flex-col" style={{ background: '#efeae2' }}>

      {/* ── WhatsApp top bar (teal-green) ─────────────────────────────── */}
      <div className="sticky top-0 z-20 shadow-md" style={{ background: '#075E54' }}>
        <div className="max-w-2xl mx-auto px-2 sm:px-4 h-14 flex items-center gap-2 text-white">
          <Link
            href={supplier?.brand_slug ? `/brand/${supplier.brand_slug}` : '/marketplace'}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/15">
            {supplier?.logo_url ? (
              <Image src={supplier.logo_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">{initial}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 leading-tight">
            <h1 className="font-semibold text-[15px] truncate">{channel.name}</h1>
            <p className="text-white/70 text-[12px] truncate">
              {channel.member_count.toLocaleString()} followers
            </p>
          </div>

          <button className="w-9 h-9 rounded-full hidden sm:flex items-center justify-center text-white/90 hover:bg-white/10"><Search className="w-5 h-5" /></button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* ── Channel intro card (like WhatsApp channel header) ─────────── */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-black/5 shadow-sm bg-[#075E54] flex items-center justify-center">
            {supplier?.logo_url ? (
              <Image src={supplier.logo_url} alt="" width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <span className="text-white font-extrabold text-4xl">{initial}</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-[#111b21] mt-3">{channel.name}</h2>
          <p className="text-[13px] text-[#667781] mt-0.5">
            Channel{supplier?.trade_name ? ` · ${supplier.trade_name}` : ''}
          </p>
          {channel.description && (
            <p className="text-[14px] text-[#3b4a54] mt-2 max-w-md leading-relaxed">{channel.description}</p>
          )}
          <p className="text-[13px] text-[#667781] mt-1.5">
            {channel.member_count.toLocaleString()} followers · {channel.post_count.toLocaleString()} posts
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <ChannelJoinButton channelId={channel.id} whatsapp={channel.whatsapp} compact={false} />
            {channel.whatsapp_channel_url && (
              <a href={channel.whatsapp_channel_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ea952] text-white text-[14px] font-bold px-5 py-2.5 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Follow WhatsApp Channel
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Feed on doodle wallpaper ──────────────────────────────────── */}
      <div className="flex-1" style={{ backgroundColor: '#efeae2', backgroundImage: DOODLE }}>
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 pb-16">

          {posts.length === 0 ? (
            <div className="flex justify-center mt-6">
              <span className="bg-[#ffffff] text-[#54656f] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
                No posts yet — follow to be the first to know.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post: any, idx: number) => {
                const cfg      = POST_TYPES[post.post_type] ?? POST_TYPES.update
                const TypeIcon = cfg.Icon
                const postDay  = new Date(post.created_at).toDateString()
                const prevDay  = idx > 0 ? new Date(posts[idx - 1].created_at).toDateString() : null
                const showDay  = postDay !== prevDay   // first post + each day change

                return (
                  <div key={post.id}>
                    {/* Date chip */}
                    {showDay && (
                      <div className="flex justify-center py-2.5">
                        <span className="bg-[#ffffff] text-[#54656f] text-[12px] font-medium px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide">
                          {fmtDay(post.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble (incoming style with tail) */}
                    <div className="flex">
                      <div className="relative max-w-[88%] sm:max-w-[78%] bg-white rounded-lg rounded-tl-none shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                        {/* little tail */}
                        <span className="absolute -left-1.5 top-0 w-2 h-3 overflow-hidden">
                          <span className="absolute right-0 top-0 w-3 h-3 bg-white rotate-45 origin-top-right" />
                        </span>

                        {/* Media — full image, correct aspect ratio (no cropping) */}
                        {post.video_url ? (
                          <div className="p-[3px]">
                            <video src={post.video_url} controls className="w-full max-h-[20rem] rounded-[6px] bg-black" />
                          </div>
                        ) : post.image_url && (
                          <div className="p-[3px]">
                            <PostImage src={post.image_url} rounded="rounded-[6px]" />
                          </div>
                        )}

                        {/* Text */}
                        <div className="px-2.5 pt-1.5 pb-1.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[13px] font-bold truncate" style={{ color: cfg.color }}>
                              {supplier?.trade_name ?? channel.name}
                            </span>
                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-px rounded ${cfg.badge}`}>
                              <TypeIcon className="w-2.5 h-2.5" />{cfg.label}
                            </span>
                          </div>
                          <p className="text-[14.2px] leading-[19px] text-[#111b21] whitespace-pre-line">
                            {post.content}
                            <span className="inline-block w-12 h-1 align-bottom" />
                          </p>
                          <span className="float-right text-[11px] text-[#667781] -mt-3.5 ml-2">
                            {fmtTime(post.created_at)}
                          </span>
                          <div className="clear-both" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {supplier?.brand_slug && (
                <div className="pt-6 flex justify-center">
                  <Link href={`/brand/${supplier.brand_slug}`}
                    className="inline-flex items-center gap-1.5 bg-white text-[#075E54] text-[13px] font-semibold px-4 py-2 rounded-full shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] hover:bg-gray-50">
                    Visit {supplier.trade_name ?? ''} store
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
