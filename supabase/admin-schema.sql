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
