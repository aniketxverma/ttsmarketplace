import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Radio, Users, FileText, ArrowLeft, Bell, Tag, Package, Megaphone } from 'lucide-react'
import { ChannelJoinButton } from './ChannelJoinButton'

export const revalidate = 30

// ── Post type display config ─────────────────────────────────────────────────
const POST_TYPES: Record<string, { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }> = {
  update:       { label: 'Update',       badge: 'bg-blue-100 text-blue-700',   Icon: Bell      },
  offer:        { label: 'Offer',        badge: 'bg-amber-100 text-amber-700', Icon: Tag       },
  product:      { label: 'Product',      badge: 'bg-purple-100 text-purple-700',Icon: Package  },
  announcement: { label: 'Announcement', badge: 'bg-green-100 text-green-700', Icon: Megaphone },
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
    description: data.description ?? `Follow ${data.name} for updates, offers and announcements.`,
  }
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
  const posts    = postsData ?? []

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Hero / channel header ──────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3a7a 60%, #0d3060 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 py-10">

          {/* Back link */}
          {supplier?.brand_slug && (
            <Link href={`/brand/${supplier.brand_slug}`}
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to brand store
            </Link>
          )}

          {/* Channel identity */}
          <div className="flex items-start gap-5">
            {/* Supplier logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex-shrink-0 shadow-lg">
              {supplier?.logo_url ? (
                <Image src={supplier.logo_url} alt={supplier.trade_name ?? ''} width={80} height={80}
                  className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Radio className="w-8 h-8 text-white/30" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">
                {supplier?.trade_name ?? supplier?.legal_name ?? 'Supplier'} · Official Canal
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
                {channel.name}
              </h1>
              {channel.description && (
                <p className="text-white/55 text-sm leading-relaxed mb-4">{channel.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 mb-5">
                <div className="flex items-center gap-1.5 text-white/70 text-sm">
                  <Users className="w-4 h-4" />
                  <span className="font-extrabold text-white">{channel.member_count.toLocaleString()}</span>
                  <span>members</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-1.5 text-white/70 text-sm">
                  <FileText className="w-4 h-4" />
                  <span className="font-extrabold text-white">{channel.post_count.toLocaleString()}</span>
                  <span>posts</span>
                </div>
              </div>

              {/* Join button */}
              <ChannelJoinButton channelId={channel.id} whatsapp={channel.whatsapp} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Posts feed ────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-7 h-7 text-gray-200" />
            </div>
            <p className="text-gray-400 font-semibold">No posts yet — join to be the first to know!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => {
              const typeCfg = POST_TYPES[post.post_type] ?? POST_TYPES.update
              const TypeIcon = typeCfg.Icon
              return (
                <article key={post.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    {/* Post header */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0B1F4D] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                          {supplier?.logo_url ? (
                            <Image src={supplier.logo_url} alt="" width={36} height={36} className="object-cover" />
                          ) : (
                            <Radio className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-gray-900 leading-none">
                            {supplier?.trade_name ?? 'Supplier'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(post.created_at).toLocaleDateString('en', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide ${typeCfg.badge}`}>
                        <TypeIcon className="w-3 h-3" />{typeCfg.label}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>

                    {/* Image */}
                    {post.image_url && (
                      <img src={post.image_url} alt=""
                        className="mt-3 w-full rounded-xl object-cover max-h-72 border border-gray-100" />
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          {supplier?.brand_slug && (
            <Link href={`/brand/${supplier.brand_slug}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0B1F4D] hover:underline">
              Visit {supplier?.trade_name ?? ''} brand store →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
