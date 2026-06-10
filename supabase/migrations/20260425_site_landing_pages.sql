-- Site Landing Pages — Campaign Studio LPs pushed from baam-platform
--
-- Each row is one LP for one (site, slug, language). The platform pushes
-- via the v2 industry contract; idempotency_key dedupes retries.
--
-- See:
--   - baam-platform: docs/integration/industry-site-contract-v2.md
--   - baam-platform: src/lib/campaign-studio/lp-push.ts
--
-- Renderer: app/lp/[slug]/page.tsx queries this table to render the LP.

CREATE TABLE IF NOT EXISTS site_landing_pages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           text NOT NULL,
  slug              text NOT NULL,
  language          text NOT NULL DEFAULT 'en'
                      CHECK (language IN ('en', 'zh', 'es')),
  content           jsonb NOT NULL,
  variant_group     text,
  is_control        boolean NOT NULL DEFAULT true,
  traffic_weight    integer NOT NULL DEFAULT 100
                      CHECK (traffic_weight BETWEEN 0 AND 100),
  idempotency_key   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (site_id, slug, language)
);

CREATE INDEX IF NOT EXISTS idx_site_landing_pages_site_slug
  ON site_landing_pages (site_id, slug);

CREATE INDEX IF NOT EXISTS idx_site_landing_pages_idempotency
  ON site_landing_pages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_site_landing_pages_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'site_landing_pages_set_updated_at'
      AND tgrelid = 'public.site_landing_pages'::regclass
  ) THEN
    CREATE TRIGGER site_landing_pages_set_updated_at
      BEFORE UPDATE ON public.site_landing_pages
      FOR EACH ROW EXECUTE FUNCTION set_site_landing_pages_updated_at();
  END IF;
END $$;

ALTER TABLE site_landing_pages ENABLE ROW LEVEL SECURITY;

-- Anonymous public reads — LPs are user-facing.
CREATE POLICY "public_read_lps"
  ON site_landing_pages FOR SELECT USING (true);

-- Service role does all writes (the ingest endpoint uses service role).
CREATE POLICY "service_manage_lps"
  ON site_landing_pages FOR ALL USING (auth.role() = 'service_role');
