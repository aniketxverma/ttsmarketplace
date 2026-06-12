-- Track whether a supplier has picked their Shop Type (B2B vs Retail) so the
-- dashboard can prompt them once with a popup instead of sending them to Settings.
alter table suppliers add column if not exists shop_type_chosen boolean not null default false;
