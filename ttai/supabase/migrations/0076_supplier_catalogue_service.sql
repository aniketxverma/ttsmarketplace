-- ─────────────────────────────────────────────────────────────────────────────
-- "Powered by TTAIEMA catalogue" — paid service flag. When true, TTAIEMA builds
-- and maintains the supplier's professional online catalogue (Option 2). When
-- false, the supplier manages their own products & photos (Option 1). Admin-set.
-- ─────────────────────────────────────────────────────────────────────────────

alter table suppliers add column if not exists catalogue_service boolean not null default false;
