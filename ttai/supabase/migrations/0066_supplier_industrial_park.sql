-- Assign a supplier to a real industrial park / zone (slug from lib/industrial-parks.ts),
-- so the TTAI Industrial Park page groups companies by their actual park.
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS industrial_park text;
