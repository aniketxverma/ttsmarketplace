import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MapPin, Globe, Building2, Package, Calendar,
  ExternalLink, ArrowLeft, ShoppingBag, MessageSquare,
  Tag, CheckCircle2, ChevronRight,
} from 'lucide-react'

// ── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { label: string; color: string; bg: string; accent: string }> = {
  buyer:           { label: 'Buyer',           color: 'text-green-700',  bg: 'bg-green-100',  accent: '#16a34a' },
  business_client: { label: 'Business Client', color: 'text-blue-700',   bg: 'bg-blue-100',   accent: '#2563eb' },
  supplier:        { label: 'Supplier',         color: 'text-orange-700', bg: 'bg-orange-100', accent: '#F5A623' },
  broker:          { label: 'Broker',           color: 'text-purple-700', bg: 'bg-purple-100', accent: '#7c3aed' },
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('full_name, company_name, bio, username')
    .ilike('username', params.slug)
    .maybeSingle()
  if (!data) return {}
  return {
    title: `${data.full_name ?? data.username} ${data.company_name ? `— ${data.company_name}` : ''} · TTAI EMA`,
    description: data.bio?.slice(0, 160) ?? 'Profile on TTAI EMA Marketplace.',
  }
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
  // Use admin client for all queries — bypasses RLS on public page
  const admin = createAdminClient()
  const { slug } = params

  let profile: any = null

  const { data: byUsername } = await admin
    .from('profiles')
    .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url')
    .ilike('username', slug)
    .maybeSingle()

  if (byUsername) {
    profile = byUsername
  } else {
    const { data: byId } = await admin
      .from('profiles')
      .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url')
      .eq('id', slug)
      .maybeSingle()
    profile = byId
  }

  if (!profile || profile.approval_status !== 'approved') notFound()

  // Fetch supplier brand slug using admin client (bypasses RLS)
  let brandSlug: string | null = null
  if (profile.role === 'supplier') {
    const { data: sup } = await (admin as any)
      .from('suppliers')
      .select('brand_slug')
      .eq('owner_id', profile.id)
      .maybeSingle()
    brandSlug = sup?.brand_slug ?? null
  }

  const role     = ROLE_CFG[profile.role] ?? { label: profile.role ?? 'Member', color: 'text-gray-700', bg: 'bg-gray-100', accent: '#64748b' }
  const initial  = (profile.full_name ?? profile.username ?? 'U')[0].toUpperCase()
  const location = [profile.city, profile.country_name].filter(Boolean).join(', ')
  const since    = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const productTags = profile.products_offered
    ? profile.products_offered.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 12)
    : []

  return (
    <div className="min-h-screen bg-[#F4F6FB]">

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0B1F4D] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />Marketplace
          </Link>
          <Link href="/" className="font-extrabold text-sm tracking-tight text-white">
            TTAI <span className="text-[#F5A623]">EMA</span>
          </Link>
          <Link href="/register" className="text-xs font-bold text-[#F5A623] hover:text-[#fbb93a] transition-colors">
            Join Free →
          </Link>
        </div>
      </div>

      {/* ── Cover banner ────────────────────────────────────────────────── */}
      <div className="relative h-48 sm:h-56 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #0d2660 50%, #1a3a8a 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute top-8 right-1/4 w-36 h-36 rounded-full bg-[#F5A623]/[0.07] pointer-events-none" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

        {/* Avatar — positioned at bottom of banner, halfway out */}
        <div className="absolute bottom-0 left-5 sm:left-8 translate-y-1/2 z-20">
          <div className="relative">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-[#0B1F4D] flex items-center justify-center"
              style={{ boxShadow: `0 0 0 4px ${role.accent}40, 0 8px 32px rgba(0,0,0,0.35)` }}
            >
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.full_name ?? 'Profile'} width={112} height={112}
                  className="object-cover w-full h-full" />
              ) : (
                <span className="text-white font-extrabold text-4xl sm:text-5xl">{initial}</span>
              )}
            </div>
            {/* Verified dot */}
            <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile header card ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-b-3xl sm:rounded-3xl shadow-lg border border-gray-100/50 overflow-hidden">
          {/* Role accent bar at top */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${role.accent}, ${role.accent}99)` }} />

          {/* Content — pt large to clear the avatar */}
          <div className="px-4 sm:px-8 pt-14 sm:pt-16 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

              {/* Left: name + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight">
                    {profile.full_name ?? profile.username ?? 'Anonymous'}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${role.bg} ${role.color} shrink-0`}>
                    {role.label}
                  </span>
                </div>

                {profile.username && (
                  <p className="text-gray-400 text-sm font-mono">@{profile.username}</p>
                )}
                {profile.company_name && (
                  <p className="text-gray-600 font-semibold text-[15px] mt-0.5">{profile.company_name}</p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />{location}
                    </span>
                  )}
                  {profile.category && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />{profile.category}
                    </span>
                  )}
                  {profile.business_type && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />{profile.business_type}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />Since {since}
                  </span>
                </div>
              </div>

              {/* Right: action buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                {profile.role === 'supplier' && brandSlug ? (
                  <Link href={`/brand/${brandSlug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[#162d6e] transition-colors shadow-sm">
                    <ShoppingBag className="w-4 h-4" />View Brand Store
                  </Link>
                ) : (
                  <Link href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[#162d6e] transition-colors shadow-sm">
                    <MessageSquare className="w-4 h-4" />Connect
                  </Link>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 text-gray-600 px-4 py-2.5 text-sm font-semibold hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors">
                    <Globe className="w-4 h-4" />Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Supplier brand store banner ─────────────────────────────── */}
        {profile.role === 'supplier' && brandSlug && (
          <Link href={`/brand/${brandSlug}`}
            className="mt-4 flex items-center justify-between gap-4 bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] rounded-2xl px-5 sm:px-7 py-5 shadow-md hover:shadow-lg transition-shadow group">
            <div>
              <p className="text-white/50 text-[11px] font-extrabold uppercase tracking-widest mb-1">Official Brand Store</p>
              <p className="text-white font-extrabold text-lg leading-tight">{profile.company_name ?? profile.full_name}</p>
              <p className="text-white/50 text-xs mt-0.5">Browse their wholesale catalogue →</p>
            </div>
            <div className="shrink-0 w-11 h-11 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <ShoppingBag className="w-5 h-5 text-[#F5A623]" />
            </div>
          </Link>
        )}

        {/* ── Content grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 pb-12">

          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* About / Bio */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">
                <span className="w-1 h-4 rounded-full inline-block shrink-0" style={{ background: role.accent }} />
                About
              </h2>
              {profile.bio ? (
                <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No bio has been added yet.</p>
              )}
            </div>

            {/* Products / services */}
            {productTags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">
                  <span className="w-1 h-4 rounded-full bg-[#0B1F4D] inline-block shrink-0" />
                  {profile.role === 'supplier' ? 'Products & Services' : profile.role === 'broker' ? 'Specialisations' : 'Looking For'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {productTags.map((tag: string) => (
                    <span key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F4D]/6 text-[#0B1F4D] text-sm font-semibold">
                      <Package className="w-3 h-3 opacity-50" />{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state CTA */}
            {!profile.bio && productTags.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-500 font-semibold text-sm">Profile is still being set up</p>
                <p className="text-gray-400 text-xs mt-1">Check back soon for more details.</p>
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">Details</h2>
              <div className="space-y-3.5">
                {[
                  { Icon: CheckCircle2, label: 'Role',        value: role.label },
                  { Icon: Building2,    label: 'Type',        value: profile.business_type },
                  { Icon: MapPin,       label: 'Location',    value: location || null },
                  { Icon: Tag,          label: 'Category',    value: profile.category },
                  { Icon: Calendar,     label: 'Member since',value: since },
                ].filter(r => r.value).map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-gray-700 truncate">{value}</p>
                    </div>
                  </div>
                ))}
                {profile.website_url && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Website</p>
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-[#0B1F4D] hover:underline truncate block">
                        {profile.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-5 text-white shadow-md overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #0B1F4D 0%, #1a3580 100%)' }}>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <ShoppingBag className="w-4 h-4 text-[#F5A623]" />
              </div>
              <p className="font-extrabold text-sm mb-1">
                {profile.role === 'supplier' && brandSlug ? 'Browse Products' : 'Join TTAI EMA'}
              </p>
              <p className="text-blue-200 text-xs mb-4 leading-relaxed">
                {profile.role === 'supplier' && brandSlug
                  ? 'Wholesale products direct from this supplier'
                  : 'Free platform to connect with verified suppliers across Europe & Africa'}
              </p>
              <Link
                href={profile.role === 'supplier' && brandSlug ? `/brand/${brandSlug}` : '/register'}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#F5A623] text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">
                {profile.role === 'supplier' && brandSlug ? 'View Brand Store' : 'Register Free'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Profile URL */}
            {profile.username && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold mb-2">Profile URL</p>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="text-xs font-mono text-gray-500 truncate">
                    /profile/<span className="text-[#0B1F4D] font-bold">{profile.username}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
