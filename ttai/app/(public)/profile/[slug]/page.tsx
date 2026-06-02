import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  buyer:           { label: 'Buyer',           color: 'text-green-700',  bg: 'bg-green-100'  },
  business_client: { label: 'Business Client', color: 'text-blue-700',   bg: 'bg-blue-100'   },
  supplier:        { label: 'Supplier',         color: 'text-orange-700', bg: 'bg-orange-100' },
  broker:          { label: 'Broker',           color: 'text-purple-700', bg: 'bg-purple-100' },
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { slug } = params

  // Try username first, then fall back to UUID id
  let profile = null

  // username lookup (exact match, case-insensitive via ilike)
  const { data: byUsername } = await supabase
    .from('profiles')
    .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url')
    .ilike('username', slug)
    .maybeSingle()

  if (byUsername) {
    profile = byUsername
  } else {
    // UUID fallback
    const { data: byId } = await supabase
      .from('profiles')
      .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url')
      .eq('id', slug)
      .maybeSingle()
    profile = byId
  }

  // Only show approved profiles
  if (!profile || profile.approval_status !== 'approved') notFound()

  const roleCfg    = ROLE_CONFIG[profile.role] ?? { label: profile.role, color: 'text-gray-700', bg: 'bg-gray-100' }
  const initial    = (profile.full_name ?? 'U')[0].toUpperCase()
  const location   = [profile.city, profile.country_name, profile.continent].filter(Boolean).join(', ')
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F4D]/5 via-white to-[#F5A623]/5">

      {/* ── Topbar ── */}
      <div className="bg-[#0B1F4D] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-tight">TTAI EMA</Link>
          <Link href="/marketplace" className="text-sm text-blue-200 hover:text-white transition-colors">
            Browse Marketplace →
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl">

        {/* ── Hero card ── */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">

          {/* Colour band */}
          <div className="h-24 bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] relative">
            <div className="absolute -bottom-10 left-8">
              {profile.avatar_url ? (
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name ?? 'Profile'}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#0B1F4D] border-4 border-white shadow-lg
                  flex items-center justify-center">
                  <span className="text-white font-extrabold text-3xl">{initial}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-14 px-8 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B1F4D]">{profile.full_name}</h1>
                {profile.username && (
                  <p className="text-gray-400 text-sm font-mono mt-0.5">@{profile.username}</p>
                )}
                {profile.company_name && (
                  <p className="text-gray-600 font-semibold text-base mt-0.5">{profile.company_name}</p>
                )}
                {location && (
                  <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {location}
                  </p>
                )}
              </div>

              {/* Contact button */}
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5
                  text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Connect
              </Link>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${roleCfg.bg} ${roleCfg.color}`}>
                {roleCfg.label}
              </span>
              {profile.business_type && (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {profile.business_type}
                </span>
              )}
              {profile.category && (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#0B1F4D]/10 text-[#0B1F4D]">
                  {profile.category}
                </span>
              )}
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-100">
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            {profile.bio && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F5A623]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  About
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Products / Services */}
            {profile.products_offered && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {profile.role === 'supplier' ? 'Products & Services Offered'
                    : profile.role === 'broker' ? 'Markets & Specialisations'
                    : 'Products & Services Needed'}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {profile.products_offered}
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Quick info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Details</h2>

              {[
                { icon: <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, label: profile.business_type },
                { icon: <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: location },
                { icon: <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, label: profile.category },
              ].filter((r) => r.label).map(({ icon, label }) => (
                <div key={label as string} className="flex items-start gap-2.5">
                  {icon}
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#0B1F4D] font-semibold hover:underline"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {profile.website_url.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* CTA box */}
            <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3580] rounded-2xl p-5 text-white">
              <p className="font-bold text-sm mb-1">Interested in connecting?</p>
              <p className="text-blue-200 text-xs mb-4 leading-relaxed">
                Register for free to access contact details and start trading.
              </p>
              <Link
                href="/register"
                className="block w-full text-center rounded-xl bg-[#F5A623] text-[#0B1F4D] py-2.5
                  text-sm font-extrabold hover:bg-[#fbb93a] transition-colors"
              >
                Register Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
