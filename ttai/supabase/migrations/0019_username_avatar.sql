-- ─────────────────────────────────────────────────────────────
-- 0019 · Username + avatar_url for profiles
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Allow any authenticated user to upload their own avatar:
-- (Run in Supabase Dashboard → Storage → brand-assets → Policies)
--
--   CREATE POLICY "Avatar upload" ON storage.objects
--     FOR INSERT TO authenticated
--     WITH CHECK (bucket_id = 'brand-assets' AND name LIKE 'avatars/%');
--
--   CREATE POLICY "Avatar update" ON storage.objects
--     FOR UPDATE TO authenticated
--     USING (bucket_id = 'brand-assets' AND name LIKE 'avatars/%');
