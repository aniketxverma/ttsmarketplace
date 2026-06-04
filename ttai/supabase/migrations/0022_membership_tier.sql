-- ────────────────────────────────────────────────────────────────────────────
-- Membership tier (matchmaking access)
--
-- The B2B side of the marketplace is a paid matchmaking service. A client is
-- "presented" its counterpart in the supply chain, and how far up the chain it
-- can reach is gated by what it pays:
--
--   • Shop (retail)         standard → Suppliers · pro → + Distributors · full → + Factories
--   • Supplier / Distributor any paid → Factories (their counterpart)
--   • Factory                any paid → Suppliers & Distributors (their counterpart)
--
-- Tier is granted MANUALLY by an admin (after the client pays offline). No
-- billing integration yet — the admin sets it from the Users dashboard.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'standard', 'pro', 'full'));

COMMENT ON COLUMN profiles.tier IS
  'Matchmaking membership: free | standard | pro | full. Admin-granted. Gates which counterpart directories the client can browse (see lib/business-chain.ts).';
