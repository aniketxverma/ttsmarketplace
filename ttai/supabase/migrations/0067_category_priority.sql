-- Editorial priority for categories. Higher = appears first on the homepage,
-- category pages and search (overrides product-count ordering). Default 0.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;
