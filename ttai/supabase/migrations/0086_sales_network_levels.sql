-- Sales Network — widen the `level` check constraint.
-- The invite UI + /api/supplier/network offer six partner types
-- (distributor, importer, wholesaler, retailer, point_of_sale, customer),
-- but the original 0048 constraint only allowed the four legacy values
-- (customer, sales_point, distributor, master_distributor). Inviting a
-- Point of Sale / Importer / Wholesaler / Retailer therefore failed with
-- "violates check constraint sales_network_level_check".
-- Accept both the new set and the legacy values (existing rows stay valid).

alter table sales_network drop constraint if exists sales_network_level_check;

alter table sales_network
  add constraint sales_network_level_check
  check (level in (
    'distributor', 'importer', 'wholesaler', 'retailer', 'point_of_sale', 'customer',  -- current UI
    'sales_point', 'master_distributor'                                                -- legacy rows
  ));
