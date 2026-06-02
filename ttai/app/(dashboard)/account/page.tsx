import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import Link from 'next/link'
import { AvatarUploader } from './AvatarUploader'

const ROLE_LABEL: Record<string, string> = {
  buyer:           'Buyer',
  business_client: 'Business Client',
  supplier:        'Supplier',
  broker:          'Broker',
  admin:           'Admin',
}

const ROLE_COLOR: Record<string, string> = {
  buyer:           'bg-green-100  text-green-700',
  business_client: 'bg-blue-100   text-blue-700',
  supplier:        'bg-orange-100 text-orange-700',
  broker:          'bg-purple-100 text-purple-700',
  admin:           'bg-red-100    text-red-700',
}

const WA_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8OcEWAO7RL5qViD80e'

type QuickLink = { label: string; href: string; icon: string; desc: string }

const ROLE_QUICK_LINKS: Record<string, QuickLink[]> = {
  buyer: [
    { label: 'My Orders',    href: '/buyer/orders',    icon: '📦', desc: 'Track your purchases' },
    { label: 'Marketplace',  href: '/marketplace',     icon: '🛒', desc: 'Browse products' },
    { label: 'Messages',     href: '/buyer/messages',  icon: '💬', desc: 'Supplier chats' },
    { label: 'Channels',     href: '/buyer/channels',  icon: '📢', desc: 'Trade channels' },
  ],
  business_client: [
    { label: 'My Orders',    href: '/buyer/orders',    icon: '📦', desc: 'Track your purchases' },
    { label: 'Marketplace',  href: '/marketplace',     icon: '🛒', desc: 'Browse products' },
    { label: 'Messages',     href: '/buyer/messages',  icon: '💬', desc: 'Supplier chats' },
    { label: 'Channels',     href: '/buyer/channels',  icon: '📢', desc: 'Trade channels' },
  ],
  supplier: [
    { label: 'My Products',  href: '/supplier/products', icon: '📦', desc: 'Manage listings' },
    { label: 'Brand Profile',href: '/supplier/brand',    icon: '🏷️', desc: 'Edit your brand page' },
    { label: 'Orders',       href: '/supplier/orders',   icon: '🧾', desc: 'Incoming orders' },
    { label: 'Points of Sale',href: '/supplier/pos',     icon: '📍', desc: 'Your POS locations' },
    { label: 'Regions',      href: '/supplier/regions',  icon: '🌍', desc: 'Active regions' },
    { label: 'Messages',     href: '/supplier/messages', icon: '💬', desc: 'Buyer messages' },
  ],
  broker: [
    { label: 'My Suppliers', href: '/broker/suppliers',   icon: '🏭', desc: 'Assigned suppliers' },
    { label: 'Promotions',   href: '/broker/promotions',  icon: '⭐', desc: 'Active deals' },
    { label: 'Invoices',     href: '/broker/invoices',    icon: '🧾', desc: 'Commission invoices' },
    { label: 'Payouts',      href: '/broker/payouts',     icon: '💰', desc: 'Earnings & payouts' },
  ],
}

export default async function AccountProfilePage() {
  await requireAuth()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,role,company_name,business_type,continent,country_name,city,category,website_url,bio,products_offered,approval_status,created_at,username,avatar_url,phone')
    .eq('id', user!.id)
    .single()

  const name        = profile?.full_name ?? user?.email ?? 'User'
  const initial     = name[0].toUpperCase()
  const location    = [profile?.city, profile?.country_name, profile?.continent].filter(Boolean).join(', ')
  const roleCfg     = ROLE_LABEL[profile?.role ?? ''] ?? profile?.role ?? ''
  const roleColor   = ROLE_COLOR[profile?.role ?? ''] ?? 'bg-gray-100 text-gray-600'
  const profileSlug  = profile?.username ?? profile?.id
  const isApproved   = profile?.approval_status === 'approved'
  const settingsHref =
    profile?.role === 'supplier' ? '/supplier/settings' :
    profile?.role === 'broker'   ? '/broker/settings'   :
    '/buyer/settings'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Profile Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] relative">
          <div className="absolute -bottom-8 left-6">
            <AvatarUploader
              userId={user!.id}
              currentUrl={profile?.avatar_url ?? null}
              name={name}
            />
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-[#0B1F4D]">{name}</h1>
              {profile?.username && (
                <p className="text-sm font-mono text-gray-400">@{profile.username}</p>
              )}
              {profile?.company_name && (
                <p className="text-sm text-gray-600 font-semibold mt-0.5">{profile.company_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${roleColor}`}>
                  {roleCfg}
                </span>
                {profile?.business_type && (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                    {profile.business_type}
                  </span>
                )}
                {profile?.category && (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0B1F4D]/10 text-[#0B1F4D]">
                    {profile.category}
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Approved
                  </span>
                )}
              </div>
              {location && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {location}
                </p>
              )}
              {memberSince && (
                <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>
              )}
            </div>

            <div className="flex gap-2">
              {isApproved && profileSlug && (
                <Link
                  href={`/profile/${profileSlug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 text-gray-600 px-4 py-2 text-sm font-semibold hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Public Profile
                </Link>
              )}
              <Link
                href={settingsHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F4D] text-white px-4 py-2 text-sm font-semibold hover:bg-[#162d6b] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </Link>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed border-t border-gray-50 pt-4 line-clamp-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Role quick links ── */}
      {ROLE_QUICK_LINKS[profile?.role ?? ''] && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">
            {ROLE_LABEL[profile?.role ?? '']} Dashboard
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ROLE_QUICK_LINKS[profile!.role!].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center text-center rounded-xl border border-gray-100
                  hover:border-[#0B1F4D] hover:bg-[#0B1F4D]/5 p-4 transition-all duration-200"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-xs font-extrabold text-gray-800 group-hover:text-[#0B1F4D]">{item.label}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Role-specific main section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── WhatsApp Canal (all roles) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* WA-style green header */}
          <div className="bg-[#128C7E] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">TTAI EMA</p>
              <p className="text-white/70 text-xs">Official Channel</p>
            </div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              WhatsApp
            </span>
          </div>

          {/* Channel preview — mimics recent posts */}
          <div className="px-5 py-4 space-y-3 bg-[#ECE5DD] min-h-[120px]">
            {[
              { time: '10:30', text: '🌍 New trade opportunities in the Mediterranean region — join now!' },
              { time: '09:15', text: '📦 Featured suppliers this week: Electronics, Food & Agri, Logistics' },
              { time: 'Yesterday', text: '✅ Platform update: profile approval system now live' },
            ].map((msg) => (
              <div key={msg.time} className="bg-white rounded-xl px-3 py-2 shadow-sm max-w-[90%]">
                <p className="text-xs text-gray-700 leading-snug">{msg.text}</p>
                <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.time}</p>
              </div>
            ))}
          </div>

          {/* Join CTA */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-500 mb-3">
              Join our official WhatsApp channel for trade updates, new suppliers, and platform news.
            </p>
            <a
              href={WA_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] text-white
                py-2.5 text-sm font-extrabold hover:bg-[#1ebe5d] transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Join TTAI Channel
            </a>
          </div>
        </div>

        {/* ── Second card — role-specific ── */}
        {(profile?.role === 'supplier') ? (
          /* Supplier tools card */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Supplier Tools</p>
                <p className="text-white/70 text-xs">Manage your business</p>
              </div>
            </div>
            <div className="flex-1 px-5 py-4 space-y-2">
              {[
                { href: '/supplier/products', label: 'My Products',   icon: '📦', desc: 'Add & manage listings' },
                { href: '/supplier/brand',    label: 'Brand Profile', icon: '🏷️', desc: 'Edit your public page' },
                { href: '/supplier/orders',   label: 'Orders',        icon: '🧾', desc: 'Incoming orders' },
                { href: '/supplier/pos',      label: 'Points of Sale',icon: '📍', desc: 'Manage POS locations' },
                { href: '/supplier/regions',  label: 'Regions',       icon: '🌍', desc: 'Active distribution zones' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl hover:bg-orange-50 px-3 py-2.5 transition-colors group">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-orange-700">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ) : (profile?.role === 'broker') ? (
          /* Broker network card */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-violet-700 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Broker Network</p>
                <p className="text-white/70 text-xs">Manage deals & commissions</p>
              </div>
            </div>
            <div className="flex-1 px-5 py-4 space-y-2">
              {[
                { href: '/broker/suppliers',  label: 'My Suppliers',  icon: '🏭', desc: 'Assigned suppliers' },
                { href: '/broker/promotions', label: 'Promotions',    icon: '⭐', desc: 'Active deals' },
                { href: '/broker/invoices',   label: 'Invoices',      icon: '🧾', desc: 'Commission invoices' },
                { href: '/broker/payouts',    label: 'Payouts',       icon: '💰', desc: 'Earnings & payouts' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl hover:bg-purple-50 px-3 py-2.5 transition-colors group">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-purple-700">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Buyer / Business Client — Marketplace card */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Global Marketplace</p>
                <p className="text-white/70 text-xs">Trade without borders</p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[{ label: 'Suppliers', value: '200+' }, { label: 'Products', value: '1K+' }, { label: 'Regions', value: '50+' }].map(({ label, value }) => (
                <div key={label} className="py-3 text-center">
                  <p className="text-lg font-extrabold text-[#0B1F4D]">{value}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Browse by category</p>
              <div className="flex flex-wrap gap-1.5">
                {['Food & Agri', 'Electronics', 'Logistics', 'Fashion', 'Cleaning', 'Healthcare'].map((c) => (
                  <Link key={c} href={`/marketplace?category=${encodeURIComponent(c)}`}
                    className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-[#0B1F4D]/10 text-xs text-gray-600 hover:text-[#0B1F4D] font-medium transition-colors border border-gray-100">
                    {c}
                  </Link>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <Link href="/marketplace"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#F5A623] text-[#0B1F4D] py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Go to Marketplace
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Coming Soon tiles ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ComingSoonTile
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          title="B2B Shop"
          subtitle="Wholesale · Bulk Orders"
          description={profile?.role === 'supplier' ? 'Open a dedicated B2B storefront and accept bulk orders directly from verified buyers.' : 'Access exclusive B2B pricing and bulk-order options from verified suppliers.'}
          color="from-blue-600 to-blue-800"
        />

        <ComingSoonTile
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          title="Online Shop"
          subtitle="Retail · Direct to Consumer"
          description={profile?.role === 'supplier' ? 'Launch a public online store to sell directly to end consumers — by piece or subscription.' : 'Shop individual products from global suppliers delivered to your door.'}
          color="from-purple-600 to-purple-800"
        />

        {/* Projects with TTAI */}
        <ComingSoonTile
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="Projects with TTAI"
          subtitle="Invest · Partnership · Packs"
          description="Join exclusive trade projects, co-invest in distribution packs, or partner with TTAI EMA for joint ventures."
          color="from-[#0B1F4D] to-[#1a3580]"
        />
      </div>
    </div>
  )
}

function ComingSoonTile({
  icon, title, subtitle, description, color,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className={`bg-gradient-to-br ${color} px-5 py-4 flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-white/70 text-xs">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-200
          py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed select-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Coming Soon
        </div>
      </div>
    </div>
  )
}
