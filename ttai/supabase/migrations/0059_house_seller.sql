-- Trade Hub Phase 1: it sells under TTAI EMA's own profile, not third-party
-- suppliers yet. Flag the TTAI EMA seller as the "house" account; the Trade Hub
-- shows only house-seller products. Supplier participation comes in a later phase.
alter table suppliers add column if not exists is_house boolean not null default false;
create index if not exists idx_suppliers_house on suppliers(is_house) where is_house = true;
