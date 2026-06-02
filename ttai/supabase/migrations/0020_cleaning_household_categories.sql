-- ════════════════════════════════════════════════════════════════════════════
-- 0020 — Cleaning & Household category + subcategories
-- Adds a dedicated "Cleaning & Household" root category with the full
-- 15-item classification (per client request). Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Root category: Cleaning & Household
INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
SELECT 'Cleaning & Household', 'cleaning-household', 'both', 0, 11
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'cleaning-household' AND parent_id IS NULL
);

-- 2. Subcategories under Cleaning & Household (full 15-item classification)
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT
  p.id, sub.name, sub.slug, sub.ctx::marketplace_context, 1, sub.sort_order
FROM (VALUES
  ('Cleaning Services',              'cleaning-services',        'both',       1),
  ('Detergents & Soaps',            'detergents-soaps',          'both',       2),
  ('Disinfectants & Sanitizers',    'disinfectants-sanitizers',  'both',       3),
  ('Laundry Products',              'laundry-products',          'both',       4),
  ('Household Consumables',         'household-consumables',     'both',       5),
  ('Cleaning Tools & Equipment',    'cleaning-tools-equipment',  'both',       6),
  ('Paper Products',                'paper-products',            'both',       7),
  ('Air Fresheners',                'air-fresheners',            'both',       8),
  ('Kitchen Cleaning',              'kitchen-cleaning',          'both',       9),
  ('Bathroom Cleaning',             'bathroom-cleaning',         'both',      10),
  ('Floor Care Products',           'floor-care',                'both',      11),
  ('Waste Management Products',     'waste-management',          'both',      12),
  ('Personal Hygiene Products',     'personal-hygiene',          'both',      13),
  ('Industrial Cleaning Products',  'industrial-cleaning',       'wholesale', 14),
  ('Eco-Friendly Cleaning Products','eco-friendly-cleaning',     'both',      15)
) AS sub(name, slug, ctx, sort_order)
JOIN categories p ON p.slug = 'cleaning-household' AND p.parent_id IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.slug = sub.slug AND c.parent_id = p.id
);

-- ── Notes ────────────────────────────────────────────────────────────────────
-- After running, re-tag Cleaning products to the new subcategories, e.g.:
--   UPDATE products SET category_id = (
--     SELECT id FROM categories WHERE slug = 'detergents-soaps' LIMIT 1
--   ) WHERE name ILIKE '%detergent%' OR name ILIKE '%gel%' OR name ILIKE '%soap%';
--
-- The homepage "Cleaning & Household" tile currently points to ?category=health-beauty;
-- update PRODUCT_FAMILIES slug to 'cleaning-household' once products are re-tagged.
