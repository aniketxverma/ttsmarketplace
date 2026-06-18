-- ─────────────────────────────────────────────────────────────────────────────
-- Supplier trust status — 🟣 Premium Partner flag. Reserved for strategic
-- partners working closely with TTAIEMA (priority ranking, featured promotion,
-- marketing, dedicated support). Admin-set. Pairs with ttaiema_protected (0073)
-- in lib/supplier-status.
-- ─────────────────────────────────────────────────────────────────────────────

alter table suppliers add column if not exists premium_partner boolean not null default false;
