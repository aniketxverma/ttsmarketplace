-- Premium Shop Design — first customization field: the supplier's brand accent
-- colour, applied to their public storefront (header accent + primary buttons).
-- Paid plans only (enforced in the app); empty = default navy.
alter table suppliers add column if not exists brand_color text;
