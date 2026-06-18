-- ─────────────────────────────────────────────────────────────────────────────
-- Supplier trust status — "TTAIEMA Protected" flag. A supplier opts into the
-- TTAIEMA Protected Service (logistics, inspection, order management, broker
-- protection); until then they operate independently. The public status badge
-- (Verified / Independent / Protected / Under Review / Suspended) is derived
-- from suppliers.status + reliability_tier + this flag — see lib/supplier-status.
-- ─────────────────────────────────────────────────────────────────────────────

alter table suppliers add column if not exists ttaiema_protected boolean not null default false;
