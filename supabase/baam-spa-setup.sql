-- ============================================================
-- BAAM System S — Spa Paradise  |  Supabase setup (run once)
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Order: base schema -> RLS -> migrations (seo pages, lps, grants).
-- ============================================================


-- >>>>>>>>>>>>>>>>>> admin-schema.sql <<<<<<<<<<<<<<<<<<
-- Admin dashboard tables for sites, users, media, and bookings.

create table if not exists public.sites (
  id text primary key,
  name text not null,
  domain text,
  enabled boolean not null default true,
  default_locale text not null default 'en',
  supported_locales text[] not null default array['en']::text[],
  herb_store_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_domains (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.sites(id) on delete cascade,
  domain text not null,
  environment text not null default 'prod',
  is_primary boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, domain, environment)
);

create index if not exists site_domains_domain_idx on public.site_domains (domain);

create table if not exists public.admin_users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null,
  sites text[] not null default '{}'::text[],
  avatar text,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  path text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, path)
);

create table if not exists public.booking_services (
  site_id text primary key,
  services jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_settings (
  site_id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  site_id text not null,
  service_id text not null,
  service_type text,
  date date not null,
  time text not null,
  duration_minutes integer not null,
  name text not null,
  phone text not null,
  email text not null,
  note text,
  details jsonb not null default '{}'::jsonb,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_site_date_idx on public.bookings (site_id, date);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_email text,
  action text not null,
  site_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Content entries (DB-first CMS storage)
create extension if not exists pgcrypto;

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  locale text not null,
  path text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (site_id, locale, path)
);

-- Content revisions (audit trail for content changes)
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by text,
  note text
);

-- Safe incremental migration for existing projects
alter table public.bookings
  add column if not exists service_type text;
alter table public.bookings
  add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.sites
  add column if not exists herb_store_slug text;

-- ================================================================
-- Data API explicit grants (Supabase requirement)
-- IMPORTANT: When adding new public tables, include explicit GRANTs.
-- ================================================================
grant usage on schema public to service_role;

grant select, insert, update, delete on table public.sites to service_role;
grant select, insert, update, delete on table public.site_domains to service_role;
grant select, insert, update, delete on table public.admin_users to service_role;
grant select, insert, update, delete on table public.media_assets to service_role;
grant select, insert, update, delete on table public.booking_services to service_role;
grant select, insert, update, delete on table public.booking_settings to service_role;
grant select, insert, update, delete on table public.bookings to service_role;
grant select, insert, update, delete on table public.admin_audit_logs to service_role;
grant select, insert, update, delete on table public.content_entries to service_role;
grant select, insert, update, delete on table public.content_revisions to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to service_role;


-- >>>>>>>>>>>>>>>>>> rls.sql <<<<<<<<<<<<<<<<<<
-- Enable RLS and deny all public access (anon/auth roles).

-- Sites
alter table public.sites enable row level security;
drop policy if exists "deny_public" on public.sites;
create policy "deny_public" on public.sites for all
  to anon, authenticated
  using (false) with check (false);

-- Site domains
alter table public.site_domains enable row level security;
drop policy if exists "deny_public" on public.site_domains;
create policy "deny_public" on public.site_domains for all
  to anon, authenticated
  using (false) with check (false);

-- Admin users
alter table public.admin_users enable row level security;
drop policy if exists "deny_public" on public.admin_users;
create policy "deny_public" on public.admin_users for all
  to anon, authenticated
  using (false) with check (false);

-- Admin audit logs
alter table public.admin_audit_logs enable row level security;
drop policy if exists "deny_public" on public.admin_audit_logs;
create policy "deny_public" on public.admin_audit_logs for all
  to anon, authenticated
  using (false) with check (false);

-- Media
alter table public.media_assets enable row level security;
drop policy if exists "deny_public" on public.media_assets;
create policy "deny_public" on public.media_assets for all
  to anon, authenticated
  using (false) with check (false);

-- Booking services
alter table public.booking_services enable row level security;
drop policy if exists "deny_public" on public.booking_services;
create policy "deny_public" on public.booking_services for all
  to anon, authenticated
  using (false) with check (false);

-- Booking settings
alter table public.booking_settings enable row level security;
drop policy if exists "deny_public" on public.booking_settings;
create policy "deny_public" on public.booking_settings for all
  to anon, authenticated
  using (false) with check (false);

-- Bookings
alter table public.bookings enable row level security;
drop policy if exists "deny_public" on public.bookings;
create policy "deny_public" on public.bookings for all
  to anon, authenticated
  using (false) with check (false);

-- Content entries
alter table public.content_entries enable row level security;
drop policy if exists "deny_public" on public.content_entries;
create policy "deny_public" on public.content_entries for all
  to anon, authenticated
  using (false) with check (false);

-- Content revisions
alter table public.content_revisions enable row level security;
drop policy if exists "deny_public" on public.content_revisions;
create policy "deny_public" on public.content_revisions for all
  to anon, authenticated
  using (false) with check (false);


-- >>>>>>>>>>>>>>>>>> migrations/20260306_rewrite_jobs.sql <<<<<<<<<<<<<<<<<<
-- Rewrite Studio schema (jobs/items/audit)
-- Created: 2026-03-06

create extension if not exists pgcrypto;

create table if not exists public.rewrite_jobs (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.sites(id) on delete cascade,
  locale text not null default 'en',
  scope text not null check (scope in ('services', 'conditions', 'custom')),
  target_paths jsonb not null default '[]'::jsonb,
  mode text not null default 'balanced' check (mode in ('conservative', 'balanced', 'aggressive')),
  status text not null default 'queued' check (status in ('queued', 'running', 'needs_review', 'completed', 'failed')),
  provider text not null default 'claude',
  model text,
  requirements jsonb not null default '{}'::jsonb,
  source_of_truth text not null default 'db' check (source_of_truth in ('db', 'local')),
  created_by text,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rewrite_jobs_site_locale_idx on public.rewrite_jobs (site_id, locale);
create index if not exists rewrite_jobs_status_idx on public.rewrite_jobs (status);
create index if not exists rewrite_jobs_scope_idx on public.rewrite_jobs (scope);

create table if not exists public.rewrite_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.rewrite_jobs(id) on delete cascade,
  site_id text not null references public.sites(id) on delete cascade,
  locale text not null default 'en',
  path text not null,
  field_path text not null,
  source_hash text,
  source_text text not null,
  rewritten_text text,
  similarity_score numeric(5,4),
  risk_flags jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  validation_passed boolean not null default false,
  approved boolean,
  approved_by text,
  approved_at timestamptz,
  applied boolean not null default false,
  applied_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, locale, path, field_path)
);

create index if not exists rewrite_items_job_idx on public.rewrite_items (job_id);
create index if not exists rewrite_items_site_locale_path_idx on public.rewrite_items (site_id, locale, path);
create index if not exists rewrite_items_validation_idx on public.rewrite_items (validation_passed, approved);

create table if not exists public.rewrite_audit_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.rewrite_jobs(id) on delete cascade,
  item_id uuid references public.rewrite_items(id) on delete set null,
  actor_id text,
  actor_email text,
  action text not null check (
    action in (
      'job_created',
      'job_started',
      'item_generated',
      'item_regenerated',
      'item_approved',
      'item_rejected',
      'job_applied',
      'job_rolled_back',
      'job_failed'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rewrite_audit_logs_job_idx on public.rewrite_audit_logs (job_id, created_at desc);

-- Harden by default: deny direct anon/authenticated access.
alter table public.rewrite_jobs enable row level security;
drop policy if exists "deny_public" on public.rewrite_jobs;
create policy "deny_public" on public.rewrite_jobs for all
  to anon, authenticated
  using (false) with check (false);

alter table public.rewrite_items enable row level security;
drop policy if exists "deny_public" on public.rewrite_items;
create policy "deny_public" on public.rewrite_items for all
  to anon, authenticated
  using (false) with check (false);

alter table public.rewrite_audit_logs enable row level security;
drop policy if exists "deny_public" on public.rewrite_audit_logs;
create policy "deny_public" on public.rewrite_audit_logs for all
  to anon, authenticated
  using (false) with check (false);

-- Data API explicit grants for service_role
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.rewrite_jobs to service_role;
grant select, insert, update, delete on table public.rewrite_items to service_role;
grant select, insert, update, delete on table public.rewrite_audit_logs to service_role;


-- >>>>>>>>>>>>>>>>>> migrations/20260322_site_seo_pages.sql <<<<<<<<<<<<<<<<<<
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


-- >>>>>>>>>>>>>>>>>> migrations/20260425_site_landing_pages.sql <<<<<<<<<<<<<<<<<<
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


-- >>>>>>>>>>>>>>>>>> migrations/20260513_data_api_grants.sql <<<<<<<<<<<<<<<<<<
-- Supabase Data API explicit grants (existing DB rollout)
-- Safe to re-run.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to service_role;

