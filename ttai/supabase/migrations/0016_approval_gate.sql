-- ─────────────────────────────────────────────────────────────
-- 0016 · Approval gate for user accounts
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Add approval_status column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 2. All existing accounts (admins, test users, seed data) → approved
UPDATE profiles SET approval_status = 'approved';

-- 3. New registrations will default to 'pending' automatically (see DEFAULT above)

-- ── Useful admin queries ──────────────────────────────────────
-- To approve a user:
--   UPDATE profiles SET approval_status = 'approved' WHERE id = '<user_uuid>';
--
-- To reject a user:
--   UPDATE profiles SET approval_status = 'rejected' WHERE id = '<user_uuid>';
--
-- To list all pending users:
--   SELECT id, full_name, role, created_at FROM profiles WHERE approval_status = 'pending';
