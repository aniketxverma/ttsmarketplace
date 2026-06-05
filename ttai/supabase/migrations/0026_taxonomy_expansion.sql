-- ════════════════════════════════════════════════════════════════════════════
-- 0026 — Taxonomy expansion
-- Adds families to Textile, Logistics, Industrial, Consulting; expands Home
-- Appliances; adds a new "Refurbished & Graded Electronics" root + families.
-- Globally-unique slugs. Idempotent (WHERE NOT EXISTS). (Liquidation/Outlet
-- category intentionally deferred.)
-- ════════════════════════════════════════════════════════════════════════════

-- ── New root: Refurbished & Graded Electronics ───────────────────────────────
INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
SELECT v.name, v.slug, v.ctx::marketplace_context, 0, v.sort
FROM (VALUES
  ('Refurbished & Graded Electronics', 'refurbished-electronics', 'both', 14)
) AS v(name, slug, ctx, sort)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id IS NULL);

-- ── Textile & Fashion ────────────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Garment Manufacturing', 'garment-manufacturing', 'both', 1),
  ('Fabrics & Materials',   'fabrics-materials',     'both', 2),
  ('Fashion Accessories',   'fashion-accessories',   'both', 3),
  ('Footwear',              'footwear',              'both', 4),
  ('Sportswear',            'sportswear',            'both', 5),
  ('Uniforms & Workwear',   'uniforms-workwear',     'both', 6),
  ('Luxury Fashion',        'luxury-fashion',        'both', 7),
  ('Textile Machinery',     'textile-machinery',     'wholesale', 8),
  ('Home Textiles',         'home-textiles',         'both', 9),
  ('Sustainable Textiles',  'sustainable-textiles',  'both', 10)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'textile-fashion' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Logistics & Supply Chain ─────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Freight Forwarding',      'freight-forwarding',      'both', 1),
  ('Warehousing',             'warehousing',             'both', 2),
  ('Transportation',          'transportation',          'both', 3),
  ('Shipping Services',       'shipping-services',       'both', 4),
  ('Customs Clearance',       'customs-clearance',       'both', 5),
  ('Cold Chain Logistics',    'logistics-cold-chain',    'both', 6),
  ('Fulfillment Services',    'fulfillment-services',    'both', 7),
  ('Supply Chain Management', 'supply-chain-management', 'both', 8),
  ('Cargo Handling',          'cargo-handling',          'both', 9),
  ('Last Mile Delivery',      'last-mile-delivery',      'both', 10)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'logistics-supply-chain' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Industrial & Manufacturing ───────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Industrial Machinery',  'industrial-machinery',  'wholesale', 1),
  ('CNC & Automation',      'cnc-automation',        'wholesale', 2),
  ('Robotics',              'robotics',              'wholesale', 3),
  ('Metal Fabrication',     'metal-fabrication',     'wholesale', 4),
  ('Plastic Manufacturing', 'plastic-manufacturing', 'wholesale', 5),
  ('Packaging Machinery',   'packaging-machinery',   'wholesale', 6),
  ('Production Equipment',  'production-equipment',  'wholesale', 7),
  ('Factory Solutions',     'factory-solutions',     'wholesale', 8),
  ('Industrial Components', 'industrial-components', 'wholesale', 9),
  ('Engineering Services',  'engineering-services',  'both',      10)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'industrial-manufacturing' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Consulting & Professional Services (add the missing families) ─────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Financial Services',     'financial-services',     'both', 7),
  ('IT Services',            'it-services',            'both', 8),
  ('HR & Recruitment',       'hr-recruitment',         'both', 9),
  ('Project Management',     'project-management',     'both', 10),
  ('Training & Education',   'training-education',     'both', 11),
  ('Certification Services', 'certification-services', 'both', 12),
  ('Business Development',   'business-development',   'both', 13)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'consulting-services' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Home Appliances (expand to consumer-goods families) ──────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Major Appliances',      'major-appliances',      'both', 6),
  ('Small Appliances',      'small-appliances',      'both', 7),
  ('Kitchen Appliances',    'kitchen-appliances',    'both', 8),
  ('Coffee Machines',       'coffee-machines',       'both', 9),
  ('Vacuum Cleaners',       'vacuum-cleaners',       'both', 10),
  ('Air Fryers',            'air-fryers',            'both', 11),
  ('Microwaves',            'microwaves',            'both', 12),
  ('Dishwashers',           'dishwashers',           'both', 13),
  ('Heaters',               'heaters',               'both', 14),
  ('Fans & Air Treatment',  'fans-air-treatment',    'both', 15),
  ('Smart Home Appliances', 'smart-home-appliances', 'both', 16),
  ('Outlet Appliances',     'outlet-appliances',     'both', 17),
  ('Refurbished Appliances','refurbished-appliances','both', 18)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'home-appliances' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Refurbished & Graded Electronics (families) ──────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Grade A Devices',       'refurb-grade-a',       'both', 1),
  ('Grade A+',              'refurb-grade-a-plus',  'both', 2),
  ('Grade B Devices',       'refurb-grade-b',       'both', 3),
  ('Grade C Devices',       'refurb-grade-c',       'both', 4),
  ('Smartphones',           'refurb-smartphones',   'both', 5),
  ('Laptops',               'refurb-laptops',       'both', 6),
  ('Tablets',               'refurb-tablets',       'both', 7),
  ('Desktop Computers',     'refurb-desktops',      'both', 8),
  ('Monitors',              'refurb-monitors',      'both', 9),
  ('Apple Products',        'refurb-apple',         'both', 10),
  ('Samsung Products',      'refurb-samsung',       'both', 11),
  ('Networking Equipment',  'refurb-networking',    'both', 12),
  ('Accessories',           'refurb-accessories',   'both', 13),
  ('Open Box Electronics',  'open-box-electronics', 'both', 14),
  ('Certified Refurbished', 'certified-refurbished','both', 15)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'refurbished-electronics' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);
