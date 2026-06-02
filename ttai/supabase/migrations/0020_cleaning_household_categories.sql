-- ════════════════════════════════════════════════════════════════════════════
-- 0020 — Cleaning & Household category + subcategories
-- Adds a dedicated "Cleaning & Household" root category with 8 subcategories
-- (per client classification request). Idempotent — safe to run multiple times.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Root category: Cleaning & Household
INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
SELECT 'Cleaning & Household', 'cleaning-household', 'both', 0, 11
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'cleaning-household' AND parent_id IS NULL
);

-- 2. Subcategories under Cleaning & Household
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT
  p.id, sub.name, sub.slug, sub.ctx::marketplace_context, 1, sub.sort_order
FROM (VALUES
  ('Cleaning Services',             'cleaning-services',          'both',      1),
  ('Cleaning Chemicals & Detergents','cleaning-chemicals',         'both',      2),
  ('Household Products',            'household-products',         'both',      3),
  ('Cleaning Equipment',            'cleaning-equipment',         'both',      4),
  ('Hygiene & Sanitation',          'hygiene-sanitation',         'both',      5),
  ('Paper & Disposable Products',   'paper-disposable',           'both',      6),
  ('Air Care & Fragrances',         'air-care-fragrances',        'both',      7),
  ('Industrial Cleaning',           'industrial-cleaning',        'wholesale', 8)
) AS sub(name, slug, ctx, sort_order)
JOIN categories p ON p.slug = 'cleaning-household' AND p.parent_id IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.slug = sub.slug AND c.parent_id = p.id
);

-- ── Notes ────────────────────────────────────────────────────────────────────
-- After running, re-tag Cleaning products to the new subcategories, e.g.:
--   UPDATE products SET category_id = (
--     SELECT id FROM categories WHERE slug = 'cleaning-chemicals' LIMIT 1
--   ) WHERE name ILIKE '%detergent%' OR name ILIKE '%gel%';
--
-- The homepage "Cleaning & Household" tile currently points to ?category=health-beauty;
-- update PRODUCT_FAMILIES slug to 'cleaning-household' once products are re-tagged.
