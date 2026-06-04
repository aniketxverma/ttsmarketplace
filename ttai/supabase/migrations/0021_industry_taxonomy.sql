-- ════════════════════════════════════════════════════════════════════════════
-- 0021 — Industry ecosystem taxonomy
-- 13 main (root) categories, each with subcategories covering the full business
-- ecosystem: production → manufacturing → suppliers → distribution → recycling.
-- Globally-unique slugs. Idempotent (WHERE NOT EXISTS) — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. ROOT (main) categories ───────────────────────────────────────────────
INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
SELECT v.name, v.slug, v.ctx::marketplace_context, 0, v.sort
FROM (VALUES
  ('Food & Beverage',                  'food-beverage',            'both',       1),
  ('Cleaning & Household',             'cleaning-household',       'both',       2),
  ('Personal Care',                    'personal-care',            'both',       3),
  ('Electronics & Tech',               'electronics-tech',         'both',       4),
  ('Home Appliances',                  'home-appliances',          'both',       5),
  ('Recycling & Sustainability',       'recycling-sustainability', 'both',       6),
  ('Healthcare & Medical',             'healthcare-medical',       'both',       7),
  ('Construction & Building Materials','construction-building',    'wholesale',  8),
  ('Automotive',                       'automotive',               'both',       9),
  ('Textile & Fashion',                'textile-fashion',          'both',      10),
  ('Logistics & Supply Chain',         'logistics-supply-chain',   'both',      11),
  ('Industrial & Manufacturing',       'industrial-manufacturing', 'wholesale', 12),
  ('Consulting & Professional Services','consulting-services',     'both',      13)
) AS v(name, slug, ctx, sort)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id IS NULL);

-- Helper macro pattern for subcategories: JOIN to the parent root by slug.

-- ── Food & Beverage ─────────────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Agriculture',             'agriculture',            'both', 1),
  ('Livestock',               'livestock',              'both', 2),
  ('Fisheries & Aquaculture', 'fisheries-aquaculture',  'both', 3),
  ('Food Ingredients',        'food-ingredients',       'both', 4),
  ('Food Manufacturers',      'food-manufacturers',     'both', 5),
  ('Beverage Manufacturers',  'beverage-manufacturers', 'both', 6),
  ('Suppliers',               'food-suppliers',         'both', 7),
  ('Wholesalers',             'food-wholesalers',       'both', 8),
  ('Importers',               'food-importers',         'both', 9),
  ('Exporters',               'food-exporters',         'both', 10),
  ('Distributors',            'food-distributors',      'both', 11),
  ('Supermarkets',            'supermarkets',           'both', 12),
  ('Hotels',                  'hotels',                 'both', 13),
  ('Restaurants',             'restaurants',            'both', 14),
  ('Catering',                'catering',               'both', 15),
  ('Organic Food',            'organic-food',           'both', 16),
  ('Bio Food',                'bio-food',               'both', 17),
  ('Halal Food',              'halal-food',             'both', 18),
  ('Food Packaging',          'food-packaging',         'both', 19),
  ('Cold Chain Logistics',    'cold-chain-logistics',   'both', 20),
  ('Food Waste Management',   'food-waste-management',  'both', 21),
  ('Recycling',               'food-recycling',         'both', 22)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'food-beverage' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Cleaning & Household ─────────────────────────────────────────────────────
-- Re-parent the existing 'cleaning-products' (holds live products) under the new root.
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'cleaning-household' AND parent_id IS NULL),
    depth = 1
WHERE slug = 'cleaning-products';

INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Cleaning Products',     'cleaning-products',       'both',      1),
  ('Industrial Cleaning',   'industrial-cleaning',     'wholesale', 2),
  ('Household Cleaning',    'household-cleaning',       'both',      3),
  ('Tissue & Paper Products','tissue-paper-products',  'both',      4),
  ('Disposable Products',   'disposable-products',      'both',      5),
  ('Cleaning Equipment',    'cleaning-equipment',       'both',      6),
  ('Eco-Friendly Products', 'eco-friendly-cleaning',    'both',      7),
  ('Suppliers',             'cleaning-suppliers',       'both',      8),
  ('Distributors',          'cleaning-distributors',    'both',      9),
  ('Recycling',             'cleaning-recycling',       'both',      10)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'cleaning-household' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Personal Care ────────────────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Cosmetics',           'cosmetics',              'both', 1),
  ('Perfumes',            'perfumes',               'both', 2),
  ('Hair Care',           'hair-care',              'both', 3),
  ('Skin Care',           'skin-care',              'both', 4),
  ('Personal Hygiene',    'personal-hygiene',       'both', 5),
  ('Baby Care',           'baby-care',              'both', 6),
  ('Professional Beauty', 'professional-beauty',    'both', 7),
  ('Organic Cosmetics',   'organic-cosmetics',      'both', 8),
  ('Halal Cosmetics',     'halal-cosmetics',        'both', 9),
  ('Suppliers',           'personalcare-suppliers', 'both', 10),
  ('Distributors',        'personalcare-distributors','both',11)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'personal-care' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Electronics & Tech ───────────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Smartphones',          'smartphones',           'both', 1),
  ('Computers',            'computers',             'both', 2),
  ('Networking',           'networking',            'both', 3),
  ('Telecommunications',   'telecommunications',    'both', 4),
  ('Software',             'software',              'both', 5),
  ('AI Solutions',         'ai-solutions',          'both', 6),
  ('Components',           'electronic-components',  'both', 7),
  ('Consumer Electronics', 'consumer-electronics',  'both', 8)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'electronics-tech' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Home Appliances ──────────────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Refrigerators',           'refrigerators',           'both', 1),
  ('Washing Machines',        'washing-machines',        'both', 2),
  ('Ovens',                   'ovens',                   'both', 3),
  ('Air Conditioners',        'air-conditioners',        'both', 4),
  ('Small Kitchen Appliances','small-kitchen-appliances','both', 5)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'home-appliances' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Recycling & Sustainability ───────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Plastic Recycling', 'plastic-recycling', 'both', 1),
  ('Metal Recycling',   'metal-recycling',   'both', 2),
  ('Glass Recycling',   'glass-recycling',   'both', 3),
  ('Paper Recycling',   'paper-recycling',   'both', 4),
  ('Waste Management',  'waste-management',  'both', 5),
  ('Renewable Energy',  'renewable-energy',  'both', 6),
  ('Water Treatment',   'water-treatment',   'both', 7),
  ('Circular Economy',  'circular-economy',  'both', 8)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'recycling-sustainability' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Healthcare & Medical ─────────────────────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Clinics',         'clinics',         'both', 1),
  ('Hospitals',       'hospitals',       'both', 2),
  ('Laboratories',    'laboratories',    'both', 3),
  ('Medical Devices', 'medical-devices', 'both', 4),
  ('Rehabilitation',  'rehabilitation',  'both', 5),
  ('Telemedicine',    'telemedicine',    'both', 6)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'healthcare-medical' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- ── Consulting & Professional Services ───────────────────────────────────────
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT p.id, v.name, v.slug, v.ctx::marketplace_context, 1, v.sort
FROM (VALUES
  ('Business Consulting',  'business-consulting',  'both', 1),
  ('Financial Consulting', 'financial-consulting', 'both', 2),
  ('Marketing',            'marketing-services',   'both', 3),
  ('Legal Services',       'legal-services',       'both', 4),
  ('HR Services',          'hr-services',          'both', 5),
  ('Training',             'training-services',    'both', 6)
) AS v(name, slug, ctx, sort)
JOIN categories p ON p.slug = 'consulting-services' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = v.slug AND c.parent_id = p.id);

-- Construction, Automotive, Textile & Fashion, Logistics, Industrial &
-- Manufacturing are created as roots above (no subcategories specified yet).

-- ── Notes ────────────────────────────────────────────────────────────────────
-- The homepage shows only the 13 root categories; the marketplace CategoryNav
-- renders each root with its subcategories (depth-1 children) automatically.
-- Older seed categories (agriculture-food, health-beauty, home-garden, etc.) can
-- be retired once products are re-tagged to the new taxonomy.
