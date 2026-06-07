-- ════════════════════════════════════════════════════════════════════════════
-- 0031 — Dynamic content translation cache
--
-- User-written content (product names/descriptions, brand bios) can be in ANY
-- language. We translate it on demand to the viewer's language and cache the
-- result here so each (text, target language) pair is only translated once.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_translations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash TEXT NOT NULL,          -- sha256 of the source text
  target_lang TEXT NOT NULL,          -- 'fr' | 'es' | 'de' | ...
  translated  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_hash, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_content_translations_lookup
  ON content_translations(source_hash, target_lang);

ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;

-- Public read (translations aren't sensitive); writes go through the service role.
CREATE POLICY "content_translations_public_read" ON content_translations
  FOR SELECT USING (true);
