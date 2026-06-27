import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PostOpportunityForm } from '@/components/opportunities/PostOpportunityForm'
import { OpportunityCard, type Opp } from '@/components/opportunities/OpportunityCard'
import { LOOKING_FOR, viewerRole, DEFAULT_AUDIENCE } from '@/lib/opportunities'
import { Briefcase, Search, Megaphone } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Business Opportunities · TTAI EMA',
  description: 'Factories, suppliers and distributors post what they are looking for — distributors, clients, agents and promotions across Europe, the Middle East and Africa.',
}

type SP = { kind?: string; looking?: string; mine?: string }

export default async function OpportunitiesPage({ searchParams }: { searchParams: SP }) {
  
  const tt = await localizeUI(["Business Opportunities", "Find partners across the trade chain.", "Any", "Showing opportunities relevant to", "like you.", "No opportunities yet"], getLocale())
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let myRole: string | null = null
  if (user) {
    const { data: p } = await (supabase.from('profiles') as any).select('business_type, role').eq('id', user.id).single()
    myRole = viewerRole(p?.business_type, p?.role)
  }

  let rows: Opp[] = []
  try {
    let q = (createAdminClient().from('business_opportunities') as any)
      .select('id, company_name, poster_role, kind, looking_for, title, description, product, category, country_target, contact_email, contact_whatsapp, audience, created_at')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(200)
    if (searchParams.kind === 'promotion' || searchParams.kind === 'looking') q = q.eq('kind', searchParams.kind)
    if (searchParams.looking) q = q.eq('looking_for', searchParams.looking)
    const { data } = await q
    rows = (data ?? []) as Opp[]
  } catch { rows = [] }

  // Chain visibility: a logged-in business user only sees opportunities whose
  // audience includes their role (admins/guests see everything as a showcase).
  const visible = myRole && myRole !== 'admin'
    ? rows.filter((r: any) => !r.audience?.length || r.audience.includes(myRole))
    : rows

  const tab = (k: string | null, label: string) => (
    <Link href={k ? `/opportunities?kind=${k}` : '/opportunities'}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${(searchParams.kind ?? null) === k ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500 hover:text-[#0B1F4D]'}`}>{label}</Link>
  )

  return (
    <div className="min-h-screen bg-[#F4F6FB] overflow-x-hidden">
      <div className="bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#F5A623] mb-3"><Briefcase className="w-3.5 h-3.5" /> {tt("Business Opportunities")}</span>
          <h1 className="text-3xl sm:text-4xl font-black">{tt("Find partners across the trade chain.")}</h1>
          <p className="text-blue-100/85 mt-2 max-w-2xl text-sm sm:text-base">Factories and suppliers post what they need — distributors, agents, importers or local clients. Every opportunity reaches the right level of the chain.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max">
              {tab(null, 'All')}{tab('looking', 'Looking for')}{tab('promotion', 'Promotions')}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <Link href="/opportunities" className={`px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${!searchParams.looking ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{tt("Any")}</Link>
              {LOOKING_FOR.map((l) => (
                <Link key={l.key} href={`/opportunities?looking=${l.key}`} className={`px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${searchParams.looking === l.key ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l.label}</Link>
              ))}
            </div>
          </div>

          {myRole && myRole !== 'admin' && (
            <p className="text-[11px] text-gray-400 mb-3">{tt("Showing opportunities relevant to")} <strong className="text-gray-600 capitalize">{myRole}s</strong> {tt("like you.")}</p>
          )}

          {visible.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-bold text-lg">{tt("No opportunities yet")}</p>
              <p className="text-gray-400 text-sm mt-1">Be the first — post what you&rsquo;re looking for on the right.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {visible.map((o) => <OpportunityCard key={o.id} o={o} />)}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-20"><PostOpportunityForm loggedIn={!!user} /></div>
      </div>
    </div>
  )
}
