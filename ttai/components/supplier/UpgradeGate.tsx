import Link from 'next/link'
import { Lock, Sparkles, Check } from 'lucide-react'

/**
 * Paywall card shown when a free-plan supplier opens a paid-only feature.
 * Render this in place of the feature when `tierRank(profile.tier) < 1`.
 */
export function UpgradeGate({ title, description, perks }: { title: string; description: string; perks?: string[] }) {
  return (
    <div className="max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-sm">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#F5A623]/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F5A623]/15 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-[#F5A623]" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Premium feature
          </span>
          <h2 className="text-2xl font-extrabold text-[#0B1F4D]">{title}</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">{description}</p>

          {perks && perks.length > 0 && (
            <ul className="mt-5 inline-flex flex-col gap-2 text-left">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> {p}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7">
            <Link href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] hover:bg-[#16306b] text-white px-7 py-3 text-sm font-bold transition-colors">
              <Sparkles className="w-4 h-4" /> Upgrade your plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
