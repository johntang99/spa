-- System S (Spa) — transactional collections: leads + orders
-- These are runtime writes (booking/contact form -> leads; Stripe webhook -> orders),
-- NOT content_entries. Content collections (services/team/testimonials/faqs/
-- experiences/gift_card_products/packages) live in content_entries, validated by the
-- zod collection schemas in lib/contracts/collections.ts. site_seo_pages already exists.
-- Safe to re-run (IF NOT EXISTS).

-- ---------------- leads (booking/question/package/corporate-gifting) ----------------
CREATE TABLE IF NOT EXISTS public.leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         text NOT NULL,
  type            text NOT NULL CHECK (type IN ('booking','question','package','corporate-gifting')),
  service         text,
  duration_tier   integer,
  preferred_date  date,
  time_window     text CHECK (time_window IN ('morning','afternoon','evening')),
  name            text NOT NULL,
  phone           text NOT NULL,
  email           text,
  language_pref   text CHECK (language_pref IN ('en','zh')),
  therapist_pref  text,
  notes           text,
  message         text,
  source_page     text,
  locale          text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','zh')),
  utm             jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','booked')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_site_status  ON public.leads (site_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_site_created ON public.leads (site_id, created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_public" ON public.leads;
CREATE POLICY "deny_public" ON public.leads FOR ALL
  TO anon, authenticated USING (false) WITH CHECK (false);

-- ---------------- orders (webhook-only writes; NO delete enforced at app layer) -------
CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             text NOT NULL,
  stripe_session_id   text NOT NULL UNIQUE,          -- idempotency key
  product_ref         text,
  product_kind        text,                          -- gift_card | package
  amount              numeric NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'usd',
  buyer_name          text,
  buyer_email         text,
  buyer_locale        text NOT NULL DEFAULT 'en' CHECK (buyer_locale IN ('en','zh')),
  certificate_code    text NOT NULL UNIQUE,
  status              text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','fulfilled','redeemed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  fulfilled_at        timestamptz,
  redeemed_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_orders_site_status  ON public.orders (site_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_site_created ON public.orders (site_id, created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_public" ON public.orders;
CREATE POLICY "deny_public" ON public.orders FOR ALL
  TO anon, authenticated USING (false) WITH CHECK (false);

-- ---------------- Data API grants (service_role; admin API + webhook) ----------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO service_role;
