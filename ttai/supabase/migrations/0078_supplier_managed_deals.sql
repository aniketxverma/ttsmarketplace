-- ─────────────────────────────────────────────────────────────────────────────
-- TTAIEMA-managed deals. The Marketplace is a B2B broker/connector: per supplier
-- the deal can be handled directly (buyer ↔ supplier) or coordinated by TTAIEMA.
-- When managed_deals = true, a "Want to Buy" request is also routed to the
-- Control Center (Marketplace team / Ane) so TTAIEMA coordinates stock, price,
-- delivery, dropshipping/logistics and the customer relationship.
-- ─────────────────────────────────────────────────────────────────────────────

alter table suppliers add column if not exists managed_deals boolean not null default false;
