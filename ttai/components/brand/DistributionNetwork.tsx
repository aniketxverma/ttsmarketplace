'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { CheckCircle2, Search, User, ArrowRight, X, BadgeCheck, MapPin } from 'lucide-react'
import { NET_STATUS, profileHref, regionForIso, REGION_EMOJI, type DistNetwork, type NetNode } from '@/lib/distribution-network'

function flag(iso: string) {
  return iso && iso.length === 2
    ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🌍'
}
const ST = (s: string) => (NET_STATUS as Record<string, typeof NET_STATUS['distributor']>)[s] ?? NET_STATUS.distributor

// Continent colours match the reference design.
const REGION_COLOR: Record<string, string> = {
  'Europe': '#2563eb', 'Middle East': '#16a34a', 'Africa': '#ea580c',
  'Asia': '#7c3aed', 'Americas': '#0d9488', 'Oceania': '#0891b2', 'Other': '#64748b',
}
const REGION_ORDER = ['Europe', 'Middle East', 'Africa', 'Asia', 'Americas', 'Oceania', 'Other']

// Each country card carries one of three status icons.
type Cat = 'official' | 'looking' | 'agent'
function catOf(status: string): Cat {
  if (status === 'agent') return 'agent'
  if (ST(status).opportunity) return 'looking'
  return 'official'
}
const CAT_ICON = { official: CheckCircle2, looking: Search, agent: User }
const CAT_COLOR = { official: '#16a34a', looking: '#2563eb', agent: '#ea580c' }

const MAX_CARDS = 5

// Scoped animations for the network infographic — flowing connector lines with a
// traveling glow, staggered card entrance, floating balloons + a soft radar ring.
const DN_ANIM = `
.dn-root .dn-link{position:relative;align-self:center;--dn-c:#94a3b8}
.dn-link-h{width:2.25rem;height:2px;background:repeating-linear-gradient(90deg,var(--dn-c) 0 5px,transparent 5px 11px);background-size:11px 2px;animation:dnDashH 1s linear infinite;opacity:.85}
.dn-link-v{height:1.75rem;width:2px;margin:0 auto;background:repeating-linear-gradient(180deg,var(--dn-c) 0 5px,transparent 5px 11px);background-size:2px 11px;animation:dnDashV 1s linear infinite;opacity:.85}
@keyframes dnDashH{to{background-position:11px 0}}
@keyframes dnDashV{to{background-position:0 11px}}
.dn-pulse{position:absolute;width:7px;height:7px;border-radius:9999px;background:var(--dn-c);box-shadow:0 0 8px 1px var(--dn-c)}
.dn-link-h .dn-pulse{top:50%;transform:translateY(-50%);animation:dnTravelH 2.2s ease-in-out infinite}
.dn-link-v .dn-pulse{left:50%;transform:translateX(-50%);animation:dnTravelV 2.2s ease-in-out infinite}
@keyframes dnTravelH{0%{left:-3px;opacity:0}12%{opacity:1}88%{opacity:1}100%{left:calc(100% - 3px);opacity:0}}
@keyframes dnTravelV{0%{top:-3px;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:calc(100% - 3px);opacity:0}}
.dn-root .dn-card{opacity:0;animation:dnIn .5s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes dnIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.dn-balloon{animation:dnFloat 6s ease-in-out infinite}
@keyframes dnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.dn-ring{border:2px solid var(--dn-c);opacity:0;animation:dnRadar 2.8s ease-out infinite}
@keyframes dnRadar{0%{transform:scale(.7);opacity:.55}100%{transform:scale(1.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.dn-link-h,.dn-link-v,.dn-pulse,.dn-card,.dn-balloon,.dn-ring{animation:none!important}.dn-card{opacity:1!important}}
`

export function DistributionNetwork({ net, contactBase = '/contact' }: { net: DistNetwork; contactBase?: string }) {
  const t = useT()
  const [sel, setSel] = useState<NetNode | null>(null)
  const nodes = net.nodes ?? []

  // Group by continent and compute per-continent counts.
  const map = new Map<string, NetNode[]>()
  for (const n of nodes) { const r = regionForIso(n.iso); const a = map.get(r); if (a) a.push(n); else map.set(r, [n]) }
  const regions = REGION_ORDER.filter((r) => map.has(r)).map((region) => {
    const ns = map.get(region)!
    return {
      region, nodes: ns, color: REGION_COLOR[region] ?? '#64748b',
      official: ns.filter((n) => catOf(n.status) === 'official').length,
      looking: ns.filter((n) => catOf(n.status) === 'looking').length,
      agent: ns.filter((n) => catOf(n.status) === 'agent').length,
    }
  })
  type Region = typeof regions[number]
  const byId = (id: string) => regions.find((r) => r.region === id)

  // ── A single country card ──
  const CountryCard = ({ n, idx = 0 }: { n: NetNode; idx?: number }) => {
    const cat = catOf(n.status)
    const Icon = CAT_ICON[cat]
    const color = CAT_COLOR[cat]
    const inner = (
      <>
        <span className="text-xl flex-shrink-0">{flag(n.iso)}</span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[13px] font-extrabold text-[#0B1F4D] leading-tight truncate">{n.country}</span>
          <span className="block text-[10px] font-semibold leading-tight" style={{ color }}>{t(ST(n.status).label)}</span>
          {n.company && <span className="block text-[9px] text-gray-400 leading-tight truncate">{n.company}</span>}
        </span>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      </>
    )
    const cls = 'dn-card group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-[color:var(--dn-c)] transition-all px-3 py-2 flex items-center gap-2.5 w-full'
    const style = { ['--dn-c' as any]: color, animationDelay: `${(idx % 6) * 70}ms` }
    // Always open the preview popup (company + verified + action). It routes to
    // the partner's profile when they have one, otherwise to apply/contact.
    return <button onClick={() => setSel(n)} className={cls} style={style}>{inner}</button>
  }

  // ── Country-card column (+ "X More Countries") ──
  const Cards = ({ r }: { r: Region }) => (
    <div className="flex flex-col gap-2 w-[208px]">
      {r.nodes.slice(0, MAX_CARDS).map((n, i) => <CountryCard key={i} n={n} idx={i} />)}
      {r.nodes.length > MAX_CARDS && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-[11px] font-bold text-gray-500">
          + {r.nodes.length - MAX_CARDS} {t('More Countries')}
        </div>
      )}
    </div>
  )

  // ── The continent "balloon" (map badge + counts) ──
  const Balloon = ({ r }: { r: Region }) => (
    <div className="dn-balloon rounded-[28px] border-2 bg-white shadow-md hover:shadow-xl transition-shadow px-5 py-4 w-[228px] text-center flex-shrink-0" style={{ borderColor: r.color }}>
      <span className="dn-emoji relative mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `${r.color}1A` }}>
        <span className="dn-ring absolute inset-0 rounded-full" style={{ ['--dn-c' as any]: r.color }} />
        {REGION_EMOJI[r.region] ?? '🌐'}
      </span>
      <p className="mt-2 text-lg font-black tracking-tight" style={{ color: r.color }}>{t(r.region).toUpperCase()}</p>
      <p className="text-xs font-bold text-gray-400">{r.nodes.length} {t('Countries')}</p>
      <div className="mt-2.5 rounded-xl bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold text-gray-600 space-y-1">
        {r.official > 0 && <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />{r.official} {t('Official Distributors')}</p>}
        {r.looking > 0 && <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#2563eb' }} />{r.looking} {t('Looking for Distributor')}</p>}
        {r.agent > 0 && <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#ea580c' }} />{r.agent} {t('Sales Agents')}</p>}
      </div>
    </div>
  )
  // Animated connector — flowing dashes toward the factory + a glowing pulse that
  // travels along the line (implies goods/orders moving through the network).
  const dash = (color: string, vertical = false) =>
    <div className={`dn-link ${vertical ? 'dn-link-v' : 'dn-link-h'}`} style={{ ['--dn-c' as any]: color }}>
      <span className="dn-pulse" />
    </div>

  // ── Factory centre ──
  const Factory = (
    <div className="flex flex-col items-center text-center">
      <span className="relative w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden border-4 border-white shadow-xl bg-[#0B1F4D] flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[#0B1F4D]/15 animate-ping" style={{ animationDuration: '3.5s' }} />
        {net.center.image
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={net.center.image} alt="" className="relative w-full h-full object-cover" />
          : <span className="relative text-5xl">{flag(net.center.iso)}</span>}
      </span>
      <p className="mt-2 text-base font-extrabold text-[#0B1F4D] leading-tight">{net.center.title}</p>
      {net.center.subtitle && <p className="text-[11px] text-gray-500">{net.center.subtitle}</p>}
      {net.center.since && <p className="text-[11px] font-bold text-green-600">{net.center.since}</p>}
    </div>
  )

  const e = byId('Europe'), me = byId('Middle East'), af = byId('Africa'), as = byId('Asia'), am = byId('Americas')
  const others = regions.filter((r) => !['Europe', 'Middle East', 'Africa', 'Asia', 'Americas'].includes(r.region))

  return (
    <div className="dn-root">
      <style>{DN_ANIM}</style>
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F4D] tracking-tight">{t('Global Distribution Network')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t('Our presence around the world and opportunities for new partnerships')}</p>
      </div>

      {/* ══ Desktop infographic ══ */}
      <div className="hidden lg:block mt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-6 gap-y-12 items-center justify-items-center">
          {/* Row 1 */}
          <div className="flex items-center gap-2 justify-self-end">{e && <><Cards r={e} />{dash(e.color)}<Balloon r={e} /></>}</div>
          <div />
          <div className="flex items-center gap-2 justify-self-start">{me && <><Balloon r={me} />{dash(me.color)}<Cards r={me} /></>}</div>
          {/* Row 2 */}
          <div className="flex items-center gap-2 justify-self-end">{af && <><Cards r={af} />{dash(af.color)}<Balloon r={af} /></>}</div>
          {Factory}
          <div className="flex items-center gap-2 justify-self-start">{as && <><Balloon r={as} />{dash(as.color)}<Cards r={as} /></>}</div>
          {/* Row 3 — Americas centred under the factory */}
          <div />
          {am ? <div className="flex flex-col items-center gap-2"><Balloon r={am} />{dash(am.color, true)}<div className="flex flex-wrap justify-center gap-2 max-w-[680px]">{am.nodes.slice(0, MAX_CARDS + 1).map((n, i) => <div key={i} className="w-[200px]"><CountryCard n={n} idx={i} /></div>)}{am.nodes.length > MAX_CARDS + 1 && <div className="w-[150px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-center text-[11px] font-bold text-gray-500">+ {am.nodes.length - (MAX_CARDS + 1)} {t('More Countries')}</div>}</div></div> : <div />}
          <div />
        </div>
        {others.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {others.map((r) => <div key={r.region} className="flex items-center gap-2"><Balloon r={r} />{dash(r.color)}<Cards r={r} /></div>)}
          </div>
        )}
      </div>

      {/* ══ Mobile / tablet — stacked continents ══ */}
      <div className="lg:hidden mt-6 space-y-5">
        <div className="flex justify-center">{Factory}</div>
        {regions.map((r) => (
          <div key={r.region} className="rounded-2xl border-2 bg-white shadow-sm overflow-hidden" style={{ borderColor: r.color }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: `${r.color}10` }}>
              <span className="w-11 h-11 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${r.color}1A` }}>{REGION_EMOJI[r.region] ?? '🌐'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-black leading-tight" style={{ color: r.color }}>{t(r.region).toUpperCase()}</p>
                <p className="text-[11px] font-bold text-gray-400">{r.nodes.length} {t('Countries')}</p>
              </div>
              <div className="text-[10px] font-semibold text-gray-500 text-right">
                {r.official > 0 && <p>🟢 {r.official}</p>}{r.looking > 0 && <p>🔵 {r.looking}</p>}{r.agent > 0 && <p>🟠 {r.agent}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              {r.nodes.slice(0, 6).map((n, i) => <CountryCard key={i} n={n} idx={i} />)}
              {r.nodes.length > 6 && <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-[11px] font-bold text-gray-500">+ {r.nodes.length - 6} {t('More Countries')}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ══ Legend ══ */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 border-t border-gray-100 pt-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-600" /> {t('Official Distributor')}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600"><Search className="w-4 h-4 text-blue-600" /> {t('Looking for Distributor / Importer')}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600"><User className="w-4 h-4 text-orange-500" /> {t('Sales Agent / Retail Partner')}</span>
      </div>

      {/* ══ Detail / Apply modal (opportunities & partners without a profile) ══ */}
      {sel && (() => {
        const cfg = ST(sel.status)
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSel(null)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: cfg.color }} />
              <button onClick={() => setSel(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
              <div className="p-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{flag(sel.iso)}</span>
                  <div>
                    <p className="font-extrabold text-[#0B1F4D] leading-tight">{sel.country}</p>
                    <p className="text-xs font-bold" style={{ color: cfg.color }}>{t(cfg.label)}</p>
                  </div>
                  {sel.verified && <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><BadgeCheck className="w-3.5 h-3.5" />{t('Verified by us')}</span>}
                </div>
                {sel.company && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{sel.company}</span>
                  </div>
                )}
                {cfg.opportunity && (sel.benefits?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-1.5">{t('Benefits')}</p>
                    <ul className="space-y-1">
                      {sel.benefits!.map((b) => <li key={b} className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />{b}</li>)}
                    </ul>
                  </div>
                )}
                {(() => {
                  const profile = profileHref(sel.profile)
                  // Partner with a TTAIZ page → go straight to their profile (contact them there).
                  if (profile && !cfg.opportunity) {
                    return (
                      <Link href={profile}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
                        style={{ background: cfg.color }}>
                        {t('View profile & contact')} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )
                  }
                  // Opportunity → apply; otherwise a generic contact fallback (no page to link to).
                  return (
                    <Link href={`${contactBase}${contactBase.includes('?') ? '&' : '?'}topic=distribution-network&country=${encodeURIComponent(sel.country)}`}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
                      style={{ background: cfg.opportunity ? cfg.color : '#0B1F4D' }}>
                      {cfg.opportunity ? t('Apply Now') : t('Contact this distributor')} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )
                })()}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
