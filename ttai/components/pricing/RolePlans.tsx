'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Check, Factory, Truck, Store } from 'lucide-react'
import { ROLE_PLANS } from '@/lib/pricing'
import { SubscribeButton } from '@/app/(public)/pricing/SubscribeButton'

const ICONS: Record<string, typeof Factory> = { factory: Factory, truck: Truck, store: Store }

export function RolePlans({ loggedIn, currentTier }: { loggedIn: boolean; currentTier: string }) {
  const t = useT()
  const [active, setActive] = useState(ROLE_PLANS[0].key)
  const set = ROLE_PLANS.find((r) => r.key === active) ?? ROLE_PLANS[0]
  const hasPlan = currentTier !== 'free'

  return (
    <div>
      {/* Role tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {ROLE_PLANS.map((r) => {
          const Icon = ICONS[r.icon] ?? Factory
          const on = r.key === active
          return (
            <button key={r.key} onClick={() => setActive(r.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${on ? 'bg-[#0B1F4D] text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0B1F4D]'}`}>
              <Icon className="w-4 h-4" /> {r.role}
            </button>
          )
        })}
      </div>
      <p className="text-center text-sm text-gray-400 -mt-4 mb-8">{set.blurb}</p>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {set.plans.map((p) => (
          <div key={p.tier}
            className={`relative rounded-3xl bg-white p-6 flex flex-col border transition-all duration-300 ${p.highlight ? 'border-transparent shadow-2xl ring-2 ring-[#7c3aed] md:-translate-y-2' : 'border-gray-100 shadow-lg hover:shadow-xl'}`}>
            {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">{t("Most popular")}</span>}
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: set.accent }} />
              <h3 className="text-lg font-extrabold text-[#0B1F4D]">{p.name}</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4 min-h-[56px]">{p.tagline}</p>
            <div className="flex items-end gap-1 mb-5">
              <span className="text-4xl font-extrabold text-[#0B1F4D]">{p.price}</span>
              {p.tier !== 'free' && <span className="text-gray-400 text-sm mb-1.5">/ month</span>}
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${set.accent}1a` }}>
                    <Check className="w-2.5 h-2.5" style={{ color: set.accent }} strokeWidth={3.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            {(() => {
              const btnCls = `rounded-xl px-5 py-3 text-sm font-bold transition-all ${p.highlight ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]' : p.tier === 'free' ? 'border-2 border-[#0B1F4D] text-[#0B1F4D] hover:bg-[#0B1F4D] hover:text-white' : 'bg-[#0B1F4D] text-white hover:bg-[#162d6e]'}`
              if (p.tier === 'free' && !hasPlan) {
                return <a href={loggedIn ? '/dashboard' : '/register'} className={`inline-flex items-center justify-center gap-2 ${btnCls}`}>{loggedIn ? 'Current plan' : 'Start free'}</a>
              }
              return <SubscribeButton tier={p.tier} label="Get started" loggedIn={loggedIn} isCurrent={currentTier === p.tier} hasPlan={hasPlan} className={btnCls} />
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}
