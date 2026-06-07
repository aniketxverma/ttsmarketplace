-- Family cover: lets a supplier choose which product in a product-line represents
-- the family card (image + name) in the marketplace grid. When none is flagged,
-- the first product in the line is used (previous behaviour).
alter table products
  add column if not exists is_family_cover boolean not null default false;

-- Quickly find the cover product within a supplier's line.
create index if not exists idx_products_family_cover
  on products (supplier_id, product_line)
  where is_family_cover;
