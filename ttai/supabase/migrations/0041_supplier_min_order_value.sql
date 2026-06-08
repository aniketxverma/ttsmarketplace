-- Minimum order value per supplier. Some factories/suppliers only accept orders
-- above a threshold (e.g. €5,000); the buyer can reach it with any mix of
-- products/quantities. 0 = no minimum.
alter table suppliers
  add column if not exists min_order_value_cents integer not null default 0;
