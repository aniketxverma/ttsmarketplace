-- ─── COUNTRIES ───────────────────────────────────────────────────────────────

INSERT INTO countries (iso_code, name, currency_code, vat_rate, is_eu, is_active) VALUES
  -- EU
  ('ES', 'Spain',          'EUR', 21,   true,  true),
  ('DE', 'Germany',        'EUR', 19,   true,  true),
  ('FR', 'France',         'EUR', 20,   true,  true),
  ('IT', 'Italy',          'EUR', 22,   true,  true),
  ('PT', 'Portugal',       'EUR', 23,   true,  true),
  ('NL', 'Netherlands',    'EUR', 21,   true,  true),
  ('BE', 'Belgium',        'EUR', 21,   true,  true),
  ('AT', 'Austria',        'EUR', 20,   true,  true),
  ('PL', 'Poland',         'PLN', 23,   true,  true),
  ('SE', 'Sweden',         'SEK', 25,   true,  true),
  ('DK', 'Denmark',        'DKK', 25,   true,  true),
  ('FI', 'Finland',        'EUR', 24,   true,  true),
  ('IE', 'Ireland',        'EUR', 23,   true,  true),
  ('CZ', 'Czech Republic', 'CZK', 21,   true,  true),
  ('RO', 'Romania',        'RON', 19,   true,  true),
  ('HU', 'Hungary',        'HUF', 27,   true,  true),
  ('GR', 'Greece',         'EUR', 24,   true,  true),
  ('HR', 'Croatia',        'EUR', 25,   true,  true),
  ('SK', 'Slovakia',       'EUR', 20,   true,  true),
  ('BG', 'Bulgaria',       'BGN', 20,   true,  true),
  -- Non-EU
  ('GB', 'United Kingdom', 'GBP', 20,   false, true),
  ('US', 'United States',  'USD', null, false, true),
  ('CN', 'China',          'CNY', null, false, true),
  ('AE', 'UAE',            'AED', 5,    false, true),
  ('TR', 'Turkey',         'TRY', 20,   false, true),
  ('MA', 'Morocco',        'MAD', 20,   false, true),
  ('SA', 'Saudi Arabia',   'SAR', 15,   false, true),
  ('JP', 'Japan',          'JPY', 10,   false, true),
  ('IN', 'India',          'INR', 18,   false, true),
  ('BR', 'Brazil',         'BRL', null, false, true);

-- ─── CITIES ──────────────────────────────────────────────────────────────────

INSERT INTO cities (country_id, name, slug, retail_active)
SELECT c.id, city.name, city.slug, city.retail_active
FROM (VALUES
  ('ES', 'Madrid',    'madrid',    true),
  ('ES', 'Barcelona', 'barcelona', true),
  ('ES', 'Valencia',  'valencia',  true),
  ('ES', 'Seville',   'seville',   true),
  ('ES', 'Bilbao',    'bilbao',    false),
  ('ES', 'Málaga',    'malaga',    false)
) AS city(iso, name, slug, retail_active)
JOIN countries c ON c.iso_code = city.iso;

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────

-- Root categories (depth = 0)
INSERT INTO categories (name, slug, marketplace_context, depth, sort_order) VALUES
  ('Agriculture & Food',         'agriculture-food',           'both',      0, 1),
  ('Textiles & Apparel',         'textiles-apparel',           'both',      0, 2),
  ('Electronics & Technology',   'electronics-technology',     'both',      0, 3),
  ('Construction & Materials',   'construction-materials',     'wholesale', 0, 4),
  ('Health & Beauty',            'health-beauty',              'both',      0, 5),
  ('Automotive & Transport',     'automotive-transport',       'wholesale', 0, 6),
  ('Home & Garden',              'home-garden',                'both',      0, 7),
  ('Industrial & Machinery',     'industrial-machinery',       'wholesale', 0, 8),
  ('Sports & Leisure',           'sports-leisure',             'both',      0, 9),
  ('Office & Stationery',        'office-stationery',          'both',      0, 10);

-- Sub-categories under Agriculture & Food
INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
SELECT
  p.id,
  sub.name,
  sub.slug,
  sub.ctx::marketplace_context,
  1,
  sub.sort_order
FROM (VALUES
  ('Fresh Produce',    'fresh-produce',    'both', 1),
  ('Processed Foods',  'processed-foods',  'both', 2),
  ('Beverages',        'beverages',        'both', 3),
  ('Grains & Cereals', 'grains-cereals',   'both', 4)
) AS sub(name, slug, ctx, sort_order)
JOIN categories p ON p.slug = 'agriculture-food' AND p.parent_id IS NULL;
