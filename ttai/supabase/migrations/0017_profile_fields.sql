-- ─────────────────────────────────────────────────────────────
-- 0017 · Extended profile fields for client registration
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_name  TEXT,
  ADD COLUMN IF NOT EXISTS country_name  TEXT,
  ADD COLUMN IF NOT EXISTS bio           TEXT;
