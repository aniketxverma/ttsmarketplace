'use client'

import { OpportunityTeaser, type Opp } from './OpportunityCard'

/** Auto-scrolling marquee of business opportunities for the assistant page —
 *  the "Today's Business Opportunities" banner (sibling of Today's Best Offers). */
export function OpportunityRail({ opps }: { opps: Opp[] }) {
  if (!opps.length) return null
  const track = [...opps, ...opps]
  const duration = Math.max(26, opps.length * 5)
  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
      <div className="flex gap-3 w-max animate-marquee group-hover:[animation-play-state:paused] py-1" style={{ animationDuration: `${duration}s` }}>
        {track.map((o, i) => <OpportunityTeaser key={`${o.id}-${i}`} o={o} />)}
      </div>
    </div>
  )
}
