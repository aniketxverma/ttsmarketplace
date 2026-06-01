-- ─────────────────────────────────────────────────────────────
-- 0018 · Extended profile fields (role-specific registration)
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_type    TEXT,
  ADD COLUMN IF NOT EXISTS continent        TEXT,
  ADD COLUMN IF NOT EXISTS city             TEXT,
  ADD COLUMN IF NOT EXISTS category         TEXT,
  ADD COLUMN IF NOT EXISTS annual_turnover  TEXT,
  ADD COLUMN IF NOT EXISTS website_url      TEXT,
  ADD COLUMN IF NOT EXISTS products_offered TEXT;

-- annual_turnover is private — add RLS note:
-- SELECT is allowed only for admins and the profile owner.
-- Public profile views should NOT expose this column.
