-- ────────────────────────────────────────────────────────────────────────────
-- Membership billing (Stripe subscriptions)
--
-- `profiles.tier` (migration 0022) is the access lever. These columns link a
-- profile to its Stripe customer + subscription so the webhook can keep the tier
-- in sync automatically. Admin can still override tier manually at any time.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT;  -- active | trialing | past_due | canceled | …

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

COMMENT ON COLUMN profiles.subscription_status IS
  'Mirror of the Stripe subscription status; set by the Stripe webhook. tier is downgraded to free when not active.';
