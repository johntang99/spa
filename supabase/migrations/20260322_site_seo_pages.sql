-- Site SEO Pages registry
-- Tracks which SEO landing pages exist for each site.
-- The [slug] dynamic route queries this table to determine valid SEO pages.

CREATE TABLE IF NOT EXISTS site_seo_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     text NOT NULL,
  slug        text NOT NULL,
  page_type   text NOT NULL CHECK (page_type IN (
                'seo-local-landing','seo-condition',
                'seo-resource','seo-service','seo-near-location')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (site_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_site_seo_pages_site
  ON site_seo_pages (site_id, active);

ALTER TABLE site_seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active"
  ON site_seo_pages FOR SELECT USING (active = true);

CREATE POLICY "service_manage"
  ON site_seo_pages FOR ALL USING (auth.role() = 'service_role');
