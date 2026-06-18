-- ─────────────────────────────────────────────────────────────────────────────
-- Outlet Zone — independent registration (modules) + per-supplier sell mode.
--
-- modules: which TTAIEMA modules a company has activated. A company registered
--   only in the Outlet Zone has modules = {outlet} and does NOT appear in the
--   Marketplace until they activate the marketplace module. Existing suppliers
--   default to both so nothing changes for them.
-- outlet_sell_mode: how the supplier sells in the Outlet Zone — controls the CTAs
--   on their lots (direct contact / request quote / buy online / B2B / retail+B2B).
-- ─────────────────────────────────────────────────────────────────────────────

alter table suppliers add column if not exists modules text[] not null default '{marketplace,outlet}';
alter table suppliers add column if not exists outlet_sell_mode text;  -- direct_contact | request_quote | buy_online | b2b_only | retail_b2b

create index if not exists idx_suppliers_modules on suppliers using gin (modules);
