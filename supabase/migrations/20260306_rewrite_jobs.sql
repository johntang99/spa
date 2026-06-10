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
