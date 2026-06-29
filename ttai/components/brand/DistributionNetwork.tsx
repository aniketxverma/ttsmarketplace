'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { ShieldCheck, Search, ArrowRight, X, Globe, Handshake, BadgeCheck, MapPin } from 'lucide-react'
import { NET_STATUS, profileHref, regionForIso, REGION_EMOJI, type DistNetwork, type NetNode } from '@/lib/distribution-network'

function flag(iso: string) {
  return iso && iso.length === 2
    ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🌍'
}

// Safe status lookup — tolerates legacy/unknown keys so the circle never crashes.
const ST = (s: string) => (NET_STATUS as Record<string, typeof NET_STATUS['distributor']>)[s] ?? NET_STATUS.distributor

/**
 * A mother factory's Global Distribution Network as a hub-and-spoke circle:
 * factory in the centre, partner/opportunity countries around it. Click a country
 * to see the official distributor or apply for an open opportunity in your zone.
 */
export function DistributionNetwork({ net, contactBase = '/contact' }: { net: DistNetwork; contactBase?: string }) {
  const t = useT()
  const [sel, setSel] = useState<NetNode | null>(null)
  const [activeRegion, setActiveRegion] = useState<string | null>(null)
  const nodes = net.nodes ?? []

  const stats = [
    { Icon: Globe, value: nodes.length, label: t('Countries') },
    { Icon: Handshake, value: nodes.filter((n) => ST(n.status).group === 'partner').length, label: t('Official Partners') },
    { Icon: ShieldCheck, value: nodes.filter((n) => n.verified).length, label: t('Verified Partners') },
    { Icon: Search, value: nodes.filter((n) => ST(n.status).opportunity).length, label: t('Looking for Partners') },
  ]

  // Group by continent → drill Factory → Continent → Country (continent derived
  // from each node's ISO). With a single continent we skip straight to countries.
  const regionMap = new Map<string, NetNode[]>()
  for (const n of nodes) { const r = regionForIso(n.iso); const arr = regionMap.get(r); if (arr) arr.push(n); else regionMap.set(r, [n]) }
  const regions = Array.from(regionMap, ([region, ns]) => ({ region, nodes: ns }))
  const multiRegion = regions.length > 1
  const showRegions = multiRegion && !activeRegion
  const drillNodes = !multiRegion ? nodes : (regionMap.get(activeRegion ?? '') ?? [])

  type Item = { region: string; count: number } | { node: NetNode }
  const items: Item[] = showRegions
    ? regions.map((r) => ({ region: r.region, count: r.nodes.length }))
    : drillNodes.map((node) => ({ node }))
  const itemColor = (it: Item) => ('node' in it ? ST(it.node.status).color : '#0B1F4D')

  const R = 38 // circle radius in % (kept in so node labels don't clip the edge)
  const pos = items.map((_, i) => {
    const a = ((-90 + (i * 360) / Math.max(1, items.length)) * Math.PI) / 180
    return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }
  })

  const RegionBubble = ({ region, count, onClick }: { region: string; count: number; onClick: () => void }) => (
    <button onClick={onClick} className="group flex flex-col items-center text-center w-[120px]">
      <span className="relative w-16 h-16 rounded-full bg-[#0B1F4D] text-white border-2 border-[#0B1F4D] shadow flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
        {REGION_EMOJI[region] ?? '🌐'}
      </span>
      <span className="mt-1.5 text-[12px] font-extrabold text-[#0B1F4D] leading-none">{t(region)}</span>
      <span className="text-[10px] font-semibold text-gray-400 leading-tight mt-0.5">{count} {t('countries')}</span>
    </button>
  )

  const Node = ({ n, onClick }: { n: NetNode; onClick: () => void }) => {
    const cfg = ST(n.status)
    return (
      <button onClick={onClick} className="group flex flex-col items-center text-center w-[120px]">
        <span className="relative w-16 h-16 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
          style={{ borderColor: cfg.color }}>
          {/* pulsing ring to highlight open "looking for partner" countries */}
          {cfg.opportunity && <span className="absolute inset-0 rounded-full animate-ping" style={{ border: `2px solid ${cfg.color}`, animationDuration: '2.2s' }} />}
          {flag(n.iso)}
          {n.verified && <BadgeCheck className="absolute -bottom-1 -right-1 w-5 h-5 text-green-600 bg-white rounded-full" />}
          {cfg.opportunity && <Search className="absolute -bottom-1 -right-1 w-4 h-4 text-white rounded-full p-0.5" style={{ background: cfg.color }} />}
        </span>
        <span className="mt-1.5 text-[12px] font-extrabold text-[#0B1F4D] leading-none">{n.country}</span>
        <span className="text-[10px] font-semibold leading-tight mt-0.5" style={{ color: cfg.color }}>{t(cfg.label)}</span>
        {n.company && <span className="text-[10px] text-gray-400 leading-tight">{n.company}</span>}
      </button>
    )
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4D]">{t('Global Distribution Network')}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{t('Our presence around the world and opportunities for new partnerships')}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 flex items-center gap-2.5">
            <s.Icon className="w-6 h-6 text-[#0B1F4D] flex-shrink-0" strokeWidth={1.6} />
            <div className="min-w-0">
              <p className="text-xl font-black text-[#0B1F4D] leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 font-semibold truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breadcrumb — Factory › Continent */}
      {multiRegion && (
        <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
          <button onClick={() => setActiveRegion(null)} className={`font-bold ${activeRegion ? 'text-[#0B1F4D] hover:underline' : 'text-gray-400'}`}>
            🌐 {t('All regions')}
          </button>
          {activeRegion && <><span className="text-gray-300">›</span><span className="font-extrabold text-[#0B1F4D]">{REGION_EMOJI[activeRegion]} {t(activeRegion)}</span></>}
          {showRegions && <span className="text-gray-400">— {t('tap a region to explore its countries')}</span>}
        </div>
      )}

      {/* ── Circle (md+) ── */}
      <div className="relative hidden md:block mx-auto mt-6 aspect-square w-full max-w-[720px]">
        {/* dashed world backdrop + animated connectors */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* slow-rotating orbit ring */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="70s" repeatCount="indefinite" />
            <circle cx="50" cy="50" r={R} fill="none" stroke="#cbd5e1" strokeWidth="0.25" strokeDasharray="0.6 1.4" opacity="0.7" />
          </g>
          {pos.map((p, i) => {
            const color = itemColor(items[i])
            return (
              <g key={i}>
                {/* flowing dashed link */}
                <line x1="50" y1="50" x2={p.x} y2={p.y} stroke={color} strokeWidth="0.3" strokeDasharray="1 1.1" opacity="0.4">
                  <animate attributeName="stroke-dashoffset" values="0;-2.1" dur="1.4s" repeatCount="indefinite" />
                </line>
                {/* traveling "broadcast" dot from the factory out to each country */}
                <circle r="0.75" fill={color}>
                  <animate attributeName="cx" values={`50;${p.x}`} dur="2.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="cy" values={`50;${p.y}`} dur="2.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="2.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                </circle>
              </g>
            )
          })}
        </svg>

        {/* Centre — head office / factory. The image is the centred element; the
            label floats absolutely below it so it never pushes the image off-centre. */}
        <div className="absolute z-10" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
          {/* soft pulsing halo */}
          <span className="absolute inset-0 rounded-full bg-[#0B1F4D]/15 animate-ping" style={{ animationDuration: '3.5s' }} />
          <span className="relative block w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-[#0B1F4D] flex items-center justify-center">
            {net.center.image
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={net.center.image} alt="" className="w-full h-full object-cover" />
              : <span className="text-5xl">{flag(net.center.iso)}</span>}
            <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-base">{flag(net.center.iso)}</span>
          </span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 text-center pointer-events-none">
            <p className="text-sm font-extrabold text-[#0B1F4D] leading-tight">{net.center.title}</p>
            <p className="text-[11px] text-gray-500">{net.center.subtitle}</p>
            {net.center.since && <p className="text-[11px] font-bold text-green-600">{net.center.since}</p>}
          </div>
        </div>

        {/* Continent bubbles (level 0) or country nodes (drilled in / single region) */}
        {items.map((it, i) => (
          <div key={i} className="absolute z-10" style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%`, transform: 'translate(-50%,-50%)' }}>
            {'node' in it
              ? <Node n={it.node} onClick={() => setSel(it.node)} />
              : <RegionBubble region={it.region} count={it.count} onClick={() => setActiveRegion(it.region)} />}
          </div>
        ))}
      </div>

      {/* ── Grid (mobile) ── */}
      <div className="md:hidden mt-5">
        {multiRegion && activeRegion && (
          <button onClick={() => setActiveRegion(null)} className="mb-3 text-sm font-bold text-[#0B1F4D] hover:underline">← {t('All regions')}</button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((it, i) => 'node' in it ? (() => {
            const n = it.node, cfg = ST(n.status)
            return (
              <button key={i} onClick={() => setSel(n)} className="rounded-xl border bg-white p-3 text-left flex items-start gap-2" style={{ borderColor: `${cfg.color}55` }}>
                <span className="text-xl">{flag(n.iso)}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold text-[#0B1F4D] leading-tight">{n.country}</span>
                  <span className="block text-[10px] font-semibold leading-tight" style={{ color: cfg.color }}>{t(cfg.label)}</span>
                </span>
              </button>
            )
          })() : (
            <button key={i} onClick={() => setActiveRegion(it.region)} className="rounded-xl border border-[#0B1F4D]/20 bg-[#0B1F4D]/[0.04] p-3 text-left flex items-center gap-2">
              <span className="text-xl">{REGION_EMOJI[it.region] ?? '🌐'}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-extrabold text-[#0B1F4D] leading-tight">{t(it.region)}</span>
                <span className="block text-[10px] font-semibold text-gray-400 leading-tight">{it.count} {t('countries')}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-6 border-t border-gray-100 pt-4">
        {Object.values(NET_STATUS).filter((c, i, a) => a.findIndex((x) => x.label === c.label) === i).map((c) => (
          <span key={c.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} /> {t(c.label)}
          </span>
        ))}
      </div>

      {/* ── Detail / Apply card ── */}
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
                  profileHref(sel.profile) ? (
                    <Link href={profileHref(sel.profile)!} className="mt-3 flex items-center gap-2 rounded-xl bg-[#0B1F4D]/5 border border-[#0B1F4D]/15 px-3 py-2 hover:bg-[#0B1F4D]/10 transition-colors group/co">
                      <MapPin className="w-4 h-4 text-[#0B1F4D]" />
                      <span className="text-sm font-bold text-[#0B1F4D] group-hover/co:underline">{sel.company}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0B1F4D] ml-auto group-hover/co:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{sel.company}</span>
                    </div>
                  )
                )}

                {cfg.opportunity && (sel.benefits?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-1.5">{t('Benefits')}</p>
                    <ul className="space-y-1">
                      {sel.benefits!.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cfg.opportunity ? (
                  <Link href={`${contactBase}${contactBase.includes('?') ? '&' : '?'}topic=distribution-network&country=${encodeURIComponent(sel.country)}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
                    style={{ background: cfg.color }}>
                    {t('Apply Now')} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link href={`${contactBase}${contactBase.includes('?') ? '&' : '?'}topic=distribution-network&country=${encodeURIComponent(sel.country)}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#162d6e] transition-colors">
                    {t('Contact this distributor')} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
