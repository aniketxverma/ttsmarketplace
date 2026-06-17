import Link from 'next/link'
import { MapPin, Tag, ArrowRight, Megaphone, Search } from 'lucide-react'
import { lookingForLabel, POSTER_BADGE } from '@/lib/opportunities'

export type Opp = {
  id: string; company_name: string | null; poster_role: string; kind: string
  looking_for: string | null; title: string; description: string | null
  product: string | null; category: string | null; country_target: string | null
  contact_email: string | null; contact_whatsapp: string | null; created_at: string
}

/** A single business-opportunity card (used on the board and the assistant page). */
export function OpportunityCard({ o, compact = false }: { o: Opp; compact?: boolean }) {
  const isPromo = o.kind === 'promotion'
  const lf = lookingForLabel(o.looking_for)
  const wa = o.contact_whatsapp ? `https://wa.me/${String(o.contact_whatsapp).replace(/\D/g, '')}` : null
  return (
    <div className={`rounded-2xl bg-white border border-gray-200 ${compact ? 'p-3.5' : 'p-4'} hover:shadow-md transition-shadow flex flex-col`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-extrabold px-2 py-0.5 ${isPromo ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {isPromo ? <Megaphone className="w-3 h-3" /> : <Search className="w-3 h-3" />}{isPromo ? 'Promotion' : 'Looking for'}{!isPromo && lf ? `: ${lf}` : ''}
        </span>
        <span className={`rounded-full text-[10px] font-bold px-2 py-0.5 capitalize ${POSTER_BADGE[o.poster_role] ?? 'bg-gray-100 text-gray-600'}`}>{o.poster_role}</span>
      </div>
      <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">{o.title}</h3>
      {o.company_name && <p className="text-xs text-gray-400 mt-0.5">{o.company_name}</p>}
      {!compact && o.description && <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{o.description}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
        {o.category && <span className="inline-flex items-center gap-0.5"><Tag className="w-3 h-3" />{o.category}</span>}
        {o.country_target && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{o.country_target}</span>}
      </div>
      {!compact && (o.contact_email || wa) && (
        <div className="flex gap-2 mt-3">
          {o.contact_email && <a href={`mailto:${o.contact_email}`} className="rounded-lg bg-[#0B1F4D] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#162d6e]">Respond</a>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-green-200 text-green-600 px-3.5 py-1.5 text-xs font-bold hover:bg-green-50">WhatsApp</a>}
        </div>
      )}
    </div>
  )
}

/** Tight teaser used inside the assistant marquee. */
export function OpportunityTeaser({ o }: { o: Opp }) {
  const isPromo = o.kind === 'promotion'
  const lf = lookingForLabel(o.looking_for)
  return (
    <Link href="/opportunities" className="flex-shrink-0 w-[260px] rounded-xl border border-gray-100 bg-white p-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`rounded-full text-[9px] font-extrabold px-1.5 py-0.5 ${isPromo ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>{isPromo ? 'PROMOTION' : (lf ? lf.toUpperCase() : 'OPPORTUNITY')}</span>
        <span className={`rounded-full text-[9px] font-bold px-1.5 py-0.5 capitalize ${POSTER_BADGE[o.poster_role] ?? 'bg-gray-100 text-gray-600'}`}>{o.poster_role}</span>
      </div>
      <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2">{o.title}</p>
      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
        {o.country_target && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{o.country_target}</span>}
        {o.category && <span>{o.category}</span>}
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B1F4D] mt-2">View opportunity <ArrowRight className="w-3 h-3" /></span>
    </Link>
  )
}
