import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { tierRank } from '@/lib/business-chain'
import { BrandColorEditor } from '@/components/supplier/BrandColorEditor'
import { CardTemplateEditor } from '@/components/supplier/CardTemplateEditor'
import {
  Palette, Image as ImageIcon, Sparkles, Megaphone, TrendingUp,
  Lock, Check, ArrowRight, PaintBucket, Crown,
} from 'lucide-react'

const GROUPS = [
  {
    Icon: ImageIcon, title: 'Shop Banner', color: 'from-violet-500 to-purple-600',
    features: ['Image banner upload', 'Video banner', 'Animated banner', 'Banner slider (multiple banners)'],
  },
  {
    Icon: PaintBucket, title: 'Shop Background', color: 'from-sky-500 to-blue-600',
    features: ['Custom background image', 'Custom background design', 'Custom shop theme'],
  },
  {
    Icon: Sparkles, title: 'Shop Branding', color: 'from-amber-500 to-orange-600',
    features: ['Company logo', 'Brand colors', 'Custom header design', 'Company presentation section'],
  },
  {
    Icon: Megaphone, title: 'Promotional Areas', color: 'from-pink-500 to-rose-600',
    features: ['Featured products section', 'Promotional video section', 'New arrivals section', 'Special offers section'],
  },
  {
    Icon: TrendingUp, title: 'Premium Visibility', color: 'from-emerald-500 to-green-600',
    features: ['Better positioning in search', 'Featured supplier badge', 'Homepage exposure'],
  },
]

export default async function ShopDesignPage() {
  const user = await requireAuth()
  const supabase = createClient()
  // brand_color column may not be migrated yet — fall back to id-only.
  const supRes = await (async () => {
    const sel = (cols: string) => (supabase.from('suppliers') as any).select(cols).eq('owner_id', user.id).single()
    let r = await sel('id, brand_color, card_template')
    if (r.error) r = await sel('id, brand_color')
    if (r.error) r = await sel('id')
    return r
  })()
  const supplier = supRes.data as any
  if (!supplier) redirect('/supplier/onboarding')

  const { data: prof } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
  const paid = tierRank(prof?.tier) >= 1

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D] flex items-center gap-2">
            <Palette className="w-6 h-6 text-[#F5A623]" /> Shop Design
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Personalize your storefront and build a stronger brand inside the marketplace — custom banners,
            video ads, animated content, branding and premium visibility.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {paid ? <><Crown className="w-3.5 h-3.5" /> Premium plan</> : <><Lock className="w-3.5 h-3.5" /> Free plan</>}
        </span>
      </div>

      {/* Upgrade banner (free only) */}
      {!paid && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] p-6 text-white">
          <div className="absolute -top-12 -right-10 w-48 h-48 rounded-full bg-[#F5A623]/15 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5A623] mb-1">Premium customization</p>
              <h2 className="text-xl font-extrabold">Unlock a professional, branded storefront</h2>
              <p className="text-blue-200/80 text-sm mt-1 max-w-xl">No design team? We help you build it. Upgrade to unlock banners, video ads, animated content, branding and premium visibility.</p>
            </div>
            <Link href="/pricing" className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] hover:bg-[#fbb93a] text-[#0B1F4D] px-6 py-3 text-sm font-extrabold transition-colors">
              <Sparkles className="w-4 h-4" /> Upgrade your plan
            </Link>
          </div>
        </div>
      )}

      {/* Business card style — free for everyone (card is public on the profile) */}
      <CardTemplateEditor initial={supplier.card_template ?? null} />

      {/* First live premium editor — Brand Color (paid only) */}
      {paid && <BrandColorEditor initial={supplier.brand_color ?? null} />}

      {/* Feature groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GROUPS.map((g) => {
          const card = (
            <div className={`relative h-full rounded-2xl border bg-white p-5 transition-all ${paid ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 hover:border-[#F5A623]/40 hover:shadow-md'}`}>
              {/* Lock / status badge */}
              <span className={`absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${paid ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {paid ? <><Check className="w-3 h-3" /> Included</> : <><Lock className="w-3 h-3" /> Locked</>}
              </span>

              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-white shadow-sm mb-3 ${paid ? '' : 'opacity-90'}`}>
                <g.Icon className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-[#0B1F4D]">{g.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {g.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                    {paid
                      ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <Lock className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                    {f}
                  </li>
                ))}
              </ul>

              {!paid && (
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0B1F4D] group-hover:gap-2 transition-all">
                  Upgrade to unlock <ArrowRight className="w-3.5 h-3.5" />
                </p>
              )}
            </div>
          )
          // Locked → clicking takes them to upgrade. Paid → static (editors arrive next).
          return paid
            ? <div key={g.title}>{card}</div>
            : <Link key={g.title} href="/pricing" className="group block">{card}</Link>
        })}
      </div>

      {!paid && (
        <p className="text-center text-xs text-gray-400">
          These features are part of the Premium plan. <Link href="/pricing" className="font-bold text-[#0B1F4D] hover:underline">View plans →</Link>
        </p>
      )}
    </div>
  )
}
