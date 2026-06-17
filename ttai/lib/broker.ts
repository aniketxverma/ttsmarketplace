// ─────────────────────────────────────────────────────────────────────────────
// BROKER NETWORK — points, levels & rules. Single source of truth shared by the
// broker dashboard, referral API and admin views.
// ─────────────────────────────────────────────────────────────────────────────

// Connection Points awarded per successful registration.
export const POINTS_PER_REFERRAL = 10

export type LevelKey = 'bronze' | 'silver' | 'gold' | 'platinum'

export const BROKER_LEVELS: { key: LevelKey; label: string; emoji: string; minPoints: number; color: string; perks: string }[] = [
  { key: 'bronze',   label: 'Bronze Broker',   emoji: '🥉', minPoints: 0,   color: 'text-amber-700 bg-amber-100',   perks: 'Build your protected network' },
  { key: 'silver',   label: 'Silver Broker',   emoji: '🥈', minPoints: 50,  color: 'text-slate-600 bg-slate-100',   perks: 'Better ranking + more visibility' },
  { key: 'gold',     label: 'Gold Broker',     emoji: '🥇', minPoints: 150, color: 'text-yellow-700 bg-yellow-100', perks: 'Premium features + priority opportunities' },
  { key: 'platinum', label: 'Platinum Broker', emoji: '💎', minPoints: 400, color: 'text-cyan-700 bg-cyan-100',     perks: 'Top rewards + highest commission share' },
]

export function levelForPoints(points: number) {
  let current = BROKER_LEVELS[0]
  for (const l of BROKER_LEVELS) if (points >= l.minPoints) current = l
  const idx = BROKER_LEVELS.findIndex((l) => l.key === current.key)
  const next = BROKER_LEVELS[idx + 1] ?? null
  const span = next ? next.minPoints - current.minPoints : 0
  const into = points - current.minPoints
  const progress = next ? Math.min(100, Math.round((into / span) * 100)) : 100
  const pointsToNext = next ? Math.max(0, next.minPoints - points) : 0
  return { current, next, progress, pointsToNext }
}

// Companies (referrals) needed to reach the next level — handy for messaging.
export function companiesToNext(points: number) {
  const { pointsToNext } = levelForPoints(points)
  return Math.ceil(pointsToNext / POINTS_PER_REFERRAL)
}
