import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  MapPin, Globe, Building2, Package, Calendar,
  ExternalLink, ArrowLeft, ShoppingBag, MessageSquare,
  Tag, Users, CheckCircle2,
} from 'lucide-react'

// ── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, {
  label: string; color: string; bg: string; ring: string
  cta: string; ctaDesc: string
}> = {
  buyer:           { label: 'Buyer',           color: 'text-green-700',  bg: 'bg-green-50',   ring: 'ring-green-200',  cta: 'Browse Marketplace',  ctaDesc: 'Discover thousands of wholesale products' },
  business_client: { label: 'Business Client', color: 'text-blue-700',   bg: 'bg-blue-50',    ring: 'ring-blue-200',   cta: 'Browse Marketplace',  ctaDesc: 'Source products directly from verified suppliers' },
  supplier:        { label: 'Supplier',         color: 'text-orange-700', bg: 'bg-orange-50',  ring: 'ring-orange-200', cta: 'View Brand Store',    ctaDesc: 'Browse their full product catalogue' },
  broker:          { label: 'Broker',           color: 'text-purple-700', bg: 'bg-purple-50',  ring: 'ring-purple-200', cta: 'Connect',             ctaDesc: 'Work with this broker to reach new markets' },
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, company_name, role, bio, username')
    .ilike('username', params.slug)
    .maybeSingle()
  if (!data) return {}
  return {
    title: `${data.full_name ?? data.username} ${data.company_name ? `— ${data.company_name}` : ''} · TTAI EMA`,
    description: data.bio?.slice(0, 160) ?? `${data.role} profile on TTAI EMA Marketplace.`,
  }
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { slug } = params

  // Username lookup first, UUID fallback
  let profile: any = null
  const { data: byUsername } = await supabase
    .from('profiles')
    .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url')
    .ilike('username', slug)
    .maybeSingle()

  if (byUsername) {
    profile = byUsername
  } else {
    const { data: byId } = await supabase
      .from('profiles')
      .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url')
      .eq('id', slug)
      .maybeSingle()
    profile = byId
  }

  if (!profile || profile.approval_status !== 'approved') notFound()

  // For suppliers — fetch brand slug + product count for the CTA
  let supplierBrand: { brand_slug: string | null; product_count: number } | null = null
  if (profile.role === 'supplier') {
    const { data: sup } = await (supabase as any)
      .from('suppliers')
      .select('brand_slug')
      .eq('owner_id', profile.id)
      .maybeSingle()
    if (sup?.brand_slug) {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
      supplierBrand = { brand_slug: sup.brand_slug, product_count: count ?? 0 }
    }
  }

  const roleCfg    = ROLE_CONFIG[profile.role] ?? { label: profile.role, color: 'text-gray-700', bg: 'bg-gray-100', ring: 'ring-gray-200', cta: 'Connect', ctaDesc: '' }
  const initial    = (profile.full_name ?? profile.username ?? 'U')[0].toUpperCase()
  const location   = [profile.city, profile.country_name].filter(Boolean).join(', ')
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Products offered as tags (split by comma or newline)
  const productTags = profile.products_offered
    ? profile.products_offered.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-[#F4F6FB]">

      {/* ── Top nav bar ────────────────────────────────────────────────────── */}
      <div className="bg-[#0B1F4D]/95 backdrop-blur-sm text-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between py-3">
          <Link href="/marketplace"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Marketplace
          </Link>
          <Link href="/" className="font-extrabold text-base tracking-tight">
            TTAI <span className="text-[#F5A623]">EMA</span>
          </Link>
          <Link href="/register"
            className="text-xs font-bold text-[#F5A623] hover:text-[#fbb93a] transition-colors">
            Join Free →
          </Link>
        </div>
      </div>

      {/* ── Cover banner ────────────────────────────────────────────────────── */}
      <div className="relative h-52 sm:h-64 bg-gradient-to-br from-[#0B1F4D] via-[#0d2660] to-[#1a3a8a] overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/[0.04]" />
        <div className="absolute top-10 right-1/3 w-40 h-40 rounded-full bg-[#F5A623]/10" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── Profile card ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* White card overlapping banner */}
        <div className="bg-white rounded-3xl shadow-xl -mt-16 relative z-10 overflow-hidden">

          {/* Role accent strip */}
          <div className={`h-1 w-full ${
            profile.role === 'supplier' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
            profile.role === 'broker'   ? 'bg-gradient-to-r from-purple-500 to-violet-600' :
            profile.role === 'buyer'    ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            'bg-gradient-to-r from-blue-500 to-blue-700'
          }`} />

          <div className="px-6 sm:px-10 pt-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">

              {/* Avatar — large circle */}
              <div className="flex-shrink-0 -mt-20 sm:-mt-24">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ${roleCfg.ring} bg-[#0B1F4D] flex items-center justify-center`}>
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name ?? 'Profile'}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-white font-extrabold text-4xl">{initial}</span>
                  )}
                </div>
              </div>

              {/* Name / username / company */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] leading-tight">
                        {profile.full_name}
                      </h1>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${roleCfg.bg} ${roleCfg.color}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {roleCfg.label}
                      </span>
                    </div>

                    {profile.username && (
                      <p className="text-gray-400 text-sm font-mono mt-0.5">@{profile.username}</p>
                    )}
                    {profile.company_name && (
                      <p className="text-gray-600 font-semibold text-base mt-1">{profile.company_name}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      {location && (
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <MapPin className="w-3.5 h-3.5" />{location}
                        </span>
                      )}
                      {profile.category && (
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <Tag className="w-3.5 h-3.5" />{profile.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />Member since {memberSince}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {/* Role-specific primary CTA */}
                    {profile.role === 'supplier' && supplierBrand?.brand_slug ? (
                      <Link href={`/brand/${supplierBrand.brand_slug}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[#162d6e] transition-colors shadow-sm">
                        <ShoppingBag className="w-4 h-4" />
                        View Brand Store
                      </Link>
                    ) : (
                      <Link href="/register"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-extrabold hover:bg-[#162d6e] transition-colors shadow-sm">
                        <MessageSquare className="w-4 h-4" />
                        Connect
                      </Link>
                    )}
                    {profile.website_url && (
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 text-gray-600 px-4 py-2.5 text-sm font-semibold hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors">
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Business type badge */}
                {profile.business_type && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      <Building2 className="w-3 h-3" />
                      {profile.business_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 pb-12">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* About / Bio */}
            {profile.bio ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#F5A623] inline-block" />
                  About
                </h2>
                <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">No bio added yet.</p>
              </div>
            )}

            {/* Products / Services offered */}
            {productTags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#0B1F4D] inline-block" />
                  {profile.role === 'supplier' ? 'Products & Services Offered'
                    : profile.role === 'broker' ? 'Markets & Specialisations'
                    : 'Products & Services Needed'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {productTags.map((tag: string) => (
                    <span key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F4D]/6 text-[#0B1F4D] text-sm font-semibold">
                      <Package className="w-3 h-3 opacity-60" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Supplier — brand store preview */}
            {profile.role === 'supplier' && supplierBrand?.brand_slug && (
              <Link href={`/brand/${supplierBrand.brand_slug}`}
                className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group">
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Official Brand Store</p>
                  <p className="text-white font-extrabold text-lg">{profile.company_name ?? profile.full_name}</p>
                  <p className="text-white/50 text-sm mt-0.5">Browse wholesale products →</p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
              </Link>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Details card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">Details</h2>
              <div className="space-y-3">
                {profile.role && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Role</p>
                      <p className="text-sm font-semibold text-gray-700">{roleCfg.label}</p>
                    </div>
                  </div>
                )}
                {profile.business_type && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Business Type</p>
                      <p className="text-sm font-semibold text-gray-700">{profile.business_type}</p>
                    </div>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Location</p>
                      <p className="text-sm font-semibold text-gray-700">{location}</p>
                    </div>
                  </div>
                )}
                {profile.category && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Tag className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Category</p>
                      <p className="text-sm font-semibold text-gray-700">{profile.category}</p>
                    </div>
                  </div>
                )}
                {profile.website_url && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Website</p>
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-[#0B1F4D] hover:underline truncate block">
                        {profile.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Member Since</p>
                    <p className="text-sm font-semibold text-gray-700">{memberSince}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3580] rounded-2xl p-5 text-white shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-[#F5A623]" />
              </div>
              <p className="font-extrabold text-base mb-1">{roleCfg.cta}</p>
              <p className="text-blue-200 text-xs mb-4 leading-relaxed">{roleCfg.ctaDesc}</p>
              <Link
                href={profile.role === 'supplier' && supplierBrand?.brand_slug ? `/brand/${supplierBrand.brand_slug}` : '/register'}
                className="block w-full text-center rounded-xl bg-[#F5A623] text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-sm"
              >
                {profile.role === 'supplier' && supplierBrand?.brand_slug ? 'Browse Products' : 'Register Free'}
              </Link>
              {profile.role !== 'supplier' && (
                <p className="text-center text-white/30 text-[11px] mt-2">Free forever · No credit card</p>
              )}
            </div>

            {/* Username/link share */}
            {profile.username && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Profile URL</p>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-mono text-gray-600 truncate">
                    ttai.es/profile/<span className="text-[#0B1F4D] font-bold">{profile.username}</span>
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
