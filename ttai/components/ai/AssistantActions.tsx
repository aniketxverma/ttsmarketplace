'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

/** Fire the global event the ChatWidget listens for — opens the assistant and
 *  (optionally) sends a prompt so the bot answers immediately. */
export function askAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent('ttai:assistant', { detail: { prompt } }))
}

/** A tile/card that either opens the assistant with a prompt, or navigates to a
 *  real page — used across the dashboard so every feature actually does something. */
export function ActionTile({
  icon, title, desc, prompt, href, variant = 'card',
}: {
  icon: ReactNode; title: string; desc: string; prompt?: string; href?: string
  variant?: 'card' | 'reco' | 'quick'
}) {
  const base =
    variant === 'reco'
      ? 'rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full'
      : variant === 'quick'
      ? 'flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-gray-50 transition-colors text-left w-full'
      : 'rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-md transition-all text-left w-full'

  const inner =
    variant === 'quick' ? (
      <>
        <span className="w-8 h-8 rounded-lg bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0">{icon}</span>
        <span>
          <span className="block text-sm font-bold text-gray-800 leading-tight">{title}</span>
          <span className="block text-[11px] text-gray-400">{desc}</span>
        </span>
      </>
    ) : (
      <>
        <span className="w-10 h-10 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center mb-2.5">{icon}</span>
        <p className="font-extrabold text-gray-900 text-sm">{title}</p>
        <p className="text-[11px] text-gray-400">{desc}</p>
      </>
    )

  if (href) return <Link href={href} className={base}>{inner}</Link>
  return <button type="button" onClick={() => askAssistant(prompt)} className={base}>{inner}</button>
}

/** The purple "Smart Business Matching" CTA — opens the assistant with a matching prompt. */
export function MatchButton() {
  return (
    <button
      type="button"
      onClick={() => askAssistant('Help me find the best suppliers and deals for my business — match me with verified suppliers based on what I sell.')}
      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white text-[#5b3fd6] px-4 py-2 text-sm font-extrabold hover:bg-white/90 transition-colors"
    >
      Start Matching
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
    </button>
  )
}

/** Hero "Let's explore" → opens the assistant ready to help. */
export function ExploreButton() {
  return (
    <button
      type="button"
      onClick={() => askAssistant()}
      className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors"
    >
      Ask the assistant
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
    </button>
  )
}
