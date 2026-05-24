// EcosystemChain — Server component, pure CSS breathing animation
// Cinematic visualization of: Europe → Spain → Málaga → Cleaning → Rozil
// Animation scoped exclusively to .ecosystem-node — not applied globally.

import type { ReactNode } from 'react'
import Link from 'next/link'

// ── Node data ─────────────────────────────────────────────────────────────────
interface ChainNode {
  type: string; label: string; sub: string
  delay: string; flowDelay: string; href: string
  accent: string; icon: ReactNode; isLeaf?: boolean
}

const CHAIN: ChainNode[] = [
  {
    type:    'Region',
    label:   'Europe',
    sub:     'Continental hub',
    delay:   '0s',
    flowDelay: '0s',
    href:    '/regions/europe',
    accent:  '#4B6CB7',
    icon: (
      // EU flag circle
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
        <circle cx="20" cy="20" r="19" fill="#003399" stroke="#1a4ccc" strokeWidth="1" />
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
          const a = (i * 30 - 90) * (Math.PI / 180)
          return <circle key={i} cx={20 + 11 * Math.cos(a)} cy={20 + 11 * Math.sin(a)} r="1.8" fill="#FFDD00" />
        })}
      </svg>
    ),
  },
  {
    type:    'Country',
    label:   'Spain',
    sub:     'Iberian peninsula',
    delay:   '0.6s',
    flowDelay: '0.56s',
    href:    '/marketplace',
    accent:  '#c60b1e',
    icon: (
      // Spanish flag-inspired circle
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
        <circle cx="20" cy="20" r="19" fill="#c60b1e" />
        <rect x="1" y="13" width="38" height="14" fill="#F1BF00" />
        <rect x="1" y="13" width="38" height="4"  fill="#c60b1e" />
        <rect x="1" y="23" width="38" height="4"  fill="#c60b1e" />
        <text x="20" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#c60b1e" fontFamily="sans-serif">ES</text>
      </svg>
    ),
  },
  {
    type:    'City',
    label:   'Málaga',
    sub:     'Andalucía · South',
    delay:   '1.2s',
    flowDelay: '1.12s',
    href:    '/marketplace',
    accent:  '#F5A623',
    icon: (
      // Sun + pin
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
        <circle cx="20" cy="20" r="19" fill="#1a1200" />
        {/* Sun rays */}
        {[0,45,90,135,180,225,270,315].map(angle => {
          const rad = angle * Math.PI / 180
          const x1 = 20 + 8 * Math.cos(rad), y1 = 20 + 8 * Math.sin(rad)
          const x2 = 20 + 13 * Math.cos(rad), y2 = 20 + 13 * Math.sin(rad)
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        })}
        <circle cx="20" cy="20" r="6" fill="#F5A623" />
        {/* Pin */}
        <path d="M20 14 C17 14 15 16 15 18.5 C15 22 20 27 20 27 C20 27 25 22 25 18.5 C25 16 23 14 20 14Z"
          fill="#fff" fillOpacity="0.15" stroke="#fff" strokeWidth="1" />
        <circle cx="20" cy="18.5" r="2" fill="#fff" fillOpacity="0.5" />
      </svg>
    ),
  },
  {
    type:    'Category',
    label:   'Cleaning',
    sub:     'Household products',
    delay:   '1.8s',
    flowDelay: '1.68s',
    href:    '/marketplace',
    accent:  '#22d3ee',
    icon: (
      // Cleaning droplet bottle
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
        <circle cx="20" cy="20" r="19" fill="#0a1a1f" />
        {/* Bottle body */}
        <rect x="14" y="18" width="12" height="14" rx="3" fill="#22d3ee" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1.5" />
        {/* Bottle neck */}
        <rect x="17" y="13" width="6" height="6" rx="1.5" fill="#22d3ee" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />
        {/* Cap */}
        <rect x="16" y="11" width="8" height="3" rx="1" fill="#22d3ee" />
        {/* Label shine */}
        <rect x="16" y="21" width="4" height="8" rx="2" fill="#22d3ee" fillOpacity="0.5" />
        {/* Droplet */}
        <path d="M24 24 C24 24 26 22 26 24.5 C26 25.9 25.1 27 24 27 C22.9 27 22 25.9 22 24.5 C22 22 24 24 24 24Z"
          fill="#22d3ee" fillOpacity="0.7" />
      </svg>
    ),
  },
  {
    type:    'Brand',
    label:   'Rozil',
    sub:     'Químicas Rozaf S.L.U.',
    delay:   '2.4s',
    flowDelay: '2.24s',
    href:    '/brand/rozil',
    accent:  '#C9A84C',
    isLeaf:  true,
    icon: (
      // Atomic/chemical — premium brand mark
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
        <circle cx="20" cy="20" r="19" fill="#0B1F4D" stroke="#C9A84C" strokeWidth="1.5" />
        {/* Orbit rings */}
        <ellipse cx="20" cy="20" rx="13" ry="6" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.5"
          transform="rotate(0 20 20)" />
        <ellipse cx="20" cy="20" rx="13" ry="6" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.5"
          transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="13" ry="6" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.5"
          transform="rotate(-60 20 20)" />
        {/* Nucleus */}
        <circle cx="20" cy="20" r="4" fill="#C9A84C" />
        <circle cx="20" cy="20" r="2.5" fill="#0B1F4D" />
        <circle cx="20" cy="20" r="1.2" fill="#C9A84C" />
      </svg>
    ),
  },
]

// ── Connector SVG ─────────────────────────────────────────────────────────────
function Connector({ flowDelay }: { flowDelay: string }) {
  return (
    <div className="relative flex-shrink-0 flex items-center justify-center"
      style={{ width: 64, height: 4 }}>
      {/* Static dashed line */}
      <svg width="64" height="4" className="absolute inset-0">
        <line
          x1="2" y1="2" x2="62" y2="2"
          stroke="rgba(201,168,76,0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="ecosystem-dash"
        />
      </svg>
      {/* Flowing gold dot */}
      <div
        className="ecosystem-flow-dot w-2.5 h-2.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_2px_rgba(201,168,76,0.7)]"
        style={{ animationDelay: flowDelay, top: '-3px' }}
      />
      {/* Arrow tip */}
      <svg className="absolute right-0" width="8" height="10" viewBox="0 0 8 10">
        <path d="M0 1 L7 5 L0 9" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function EcosystemChain() {
  return (
    <section className="relative py-20 px-4 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060C17 0%, #080E1C 60%, #060C17 100%)' }}>

      {/* Background depth layer — dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, #C9A84C 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Gold glow orbs — extreme corners, very subtle */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(75,108,183,0.08) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto relative">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.15em] mb-5"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#C9A84C',
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-blink" />
            TTAI Live Ecosystem Path
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Verified. Connected.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #F5E08A 50%, #C9A84C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Alive.
            </span>
          </h2>
          <p className="text-white/35 text-sm tracking-wide">
            Region · Country · City · Category · Brand — one living infrastructure
          </p>
        </div>

        {/* ── Chain ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center overflow-x-auto pb-2 gap-0"
          style={{ WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' }}>
          {CHAIN.map((node, i) => (
            <div key={node.label} className="flex items-center flex-shrink-0">

              {/* ── Node card ──────────────────────────────────────────────── */}
              <Link
                href={node.href}
                className="ecosystem-node group flex flex-col items-center rounded-2xl p-4 text-center cursor-pointer"
                style={{
                  animationDelay: node.delay,
                  width:          node.isLeaf ? 136 : 116,
                  background:     node.isLeaf
                    ? 'linear-gradient(145deg, #0B1F4D, #111f3a)'
                    : 'linear-gradient(145deg, #0d1524, #131d2e)',
                  border:         node.isLeaf
                    ? '1px solid rgba(201,168,76,0.55)'
                    : '1px solid rgba(255,255,255,0.07)',
                  // Resolved shadow is part of the breathe keyframe; this is the resting state
                  boxShadow:      node.isLeaf
                    ? '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.1)'
                    : '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                {/* Type label */}
                <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] mb-2.5 transition-colors"
                  style={{ color: node.isLeaf ? 'rgba(201,168,76,0.7)' : 'rgba(255,255,255,0.28)' }}>
                  {node.type}
                </span>

                {/* Icon ring */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `radial-gradient(circle at center, ${node.accent}18 0%, transparent 70%)`,
                    border:     `1px solid ${node.accent}30`,
                    boxShadow:  node.isLeaf ? `0 0 12px rgba(201,168,76,0.2)` : 'none',
                  }}
                >
                  {node.icon}
                </div>

                {/* Name */}
                <p className="font-extrabold text-sm text-white leading-tight mb-0.5 transition-colors group-hover:text-[#C9A84C]">
                  {node.label}
                </p>

                {/* Sub-label */}
                <p className="text-[9px] font-medium leading-tight"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {node.sub}
                </p>

                {/* Leaf "LIVE" badge */}
                {node.isLeaf && (
                  <div className="mt-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-blink flex-shrink-0" />
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#C9A84C]">Active</span>
                  </div>
                )}
              </Link>

              {/* ── Connector ──────────────────────────────────────────────── */}
              {i < CHAIN.length - 1 && (
                <Connector flowDelay={CHAIN[i + 1].flowDelay} />
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
        <div className="flex justify-center mt-10">
          <Link
            href="/brand/rozil"
            className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05))',
              border:     '1px solid rgba(201,168,76,0.3)',
              color:      '#C9A84C',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Explore Rozil on TTAI
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
