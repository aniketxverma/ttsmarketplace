/**
 * Membership ↔ Stripe price mapping.
 *
 * Each paid tier maps to a recurring Stripe Price (created in the Stripe
 * dashboard). Set the IDs in the environment:
 *
 *   STRIPE_PRICE_STANDARD=price_xxx
 *   STRIPE_PRICE_PRO=price_xxx
 *   STRIPE_PRICE_FULL=price_xxx
 *
 * `free` has no Stripe price. The webhook maps a subscription's price back to a
 * tier via `tierForPrice`.
 */

import type { Tier } from '@/lib/business-chain'

export const PRICE_BY_TIER: Record<Exclude<Tier, 'free'>, string | undefined> = {
  standard: process.env.STRIPE_PRICE_STANDARD,
  pro:      process.env.STRIPE_PRICE_PRO,
  full:     process.env.STRIPE_PRICE_FULL,
}

/** The Stripe price id for a paid tier, or null if the tier is free/not configured. */
export function priceForTier(tier: string): string | null {
  if (tier === 'free') return null
  return PRICE_BY_TIER[tier as Exclude<Tier, 'free'>] ?? null
}

/** Reverse: which tier a Stripe price id belongs to (defaults to free if unknown). */
export function tierForPrice(priceId?: string | null): Tier {
  if (!priceId) return 'free'
  const entry = (Object.entries(PRICE_BY_TIER) as [Exclude<Tier, 'free'>, string | undefined][])
    .find(([, id]) => id && id === priceId)
  return entry ? entry[0] : 'free'
}

/** A Stripe subscription is "live" (grants its tier) only in these states. */
export function isActiveStatus(status?: string | null): boolean {
  return status === 'active' || status === 'trialing'
}
