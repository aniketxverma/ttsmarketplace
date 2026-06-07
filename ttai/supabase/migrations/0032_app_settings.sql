-- ════════════════════════════════════════════════════════════════════════════
-- 0032 — App settings (admin-managed key/value, e.g. translation provider + keys)
--
-- Holds the AI translation configuration the admin sets in the dashboard:
--   translation_enabled   'true' | 'false'
--   translation_provider  'openai' | 'anthropic' | 'deepl'
--   translation_openai_key / translation_anthropic_key / translation_deepl_key
--
-- RLS is enabled with NO public policies → only the service role (admin client)
-- can read/write, so the API keys never reach the browser.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- (intentionally no policies — access only via the service-role admin client)
