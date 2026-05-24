import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import Link from 'next/link'
import Image from 'next/image'
import { Radio, Users, FileText, ExternalLink, ArrowRight } from 'lucide-react'

export const revalidate = 0

export default async function BuyerChannelsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  // Get all channels this user has joined
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
          <span className="text-sm font-extrabold text-[#0B1F4D]">{joined.length} joined</span>
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
            Visit a supplier&apos;s brand page and tap &quot;Join Canal&quot; to start receiving their exclusive updates.
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
          {joined.map((ch: any) => (
            <div key={ch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group">
              {/* Accent bar */}
              <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-700" />
              <div className="p-5">
                {/* Supplier info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0B1F4D] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
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
                    <h3 className="text-sm font-extrabold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                      {ch.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {ch.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{ch.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-bold text-gray-700">{ch.member_count.toLocaleString()}</span> members
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-bold text-gray-700">{ch.post_count.toLocaleString()}</span> posts
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/channel/${ch.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors">
                    <Radio className="w-3.5 h-3.5" />View Canal
                  </Link>
                  {ch.supplier?.brand_slug && (
                    <Link href={`/brand/${ch.supplier.brand_slug}`}
                      className="flex items-center justify-center gap-1 px-3 py-2.5 border border-gray-200 text-gray-500 hover:border-[#0B1F4D] hover:text-[#0B1F4D] rounded-xl text-xs font-bold transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />Brand
                    </Link>
                  )}
                </div>

                {/* Joined date */}
                <p className="text-[10px] text-gray-300 mt-3">
                  Joined {new Date(ch.joined_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discover more */}
      {joined.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="font-extrabold text-[#0B1F4D] text-sm">Discover more canales</p>
            <p className="text-xs text-gray-400 mt-0.5">Browse suppliers and join their official channels</p>
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
