// ============================================
// MIDDLEWARE - i18n Routing & Site Detection
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';
import { resolveStoreSlugForHost } from './lib/store-map';
import sitesData from './content/_sites.json';
import domainsData from './content/_site-domains.json';

type RuntimeEnv = 'dev' | 'staging' | 'prod';

const localeCache = new Map<string, { locale: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function normalizeDomain(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .toLowerCase();
}

function sanitizeLocale(input?: string | null): string | null {
  if (!input) return null;
  return locales.includes(input as (typeof locales)[number]) ? input : null;
}

function getRuntimeEnv(): RuntimeEnv {
  const runtime = (process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || '').toLowerCase();
  if (runtime === 'staging') return 'staging';
  if (runtime === 'prod' || runtime === 'production') return 'prod';
  return 'dev';
}

function resolveSupabaseUrl() {
  const env = getRuntimeEnv();
  if (env === 'staging') {
    return (
      process.env.SUPABASE_STAGING_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_STAGING_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  }
  if (env === 'prod') {
    return (
      process.env.SUPABASE_PROD_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_PROD_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  }
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function resolveServiceRoleKey() {
  const env = getRuntimeEnv();
  if (env === 'staging') {
    return process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (env === 'prod') {
    return process.env.SUPABASE_PROD_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getSiteDefaultLocaleFromJson(host: string): string {
  const normalizedHost = normalizeDomain(host);
  const sites = (sitesData as any).sites || [];
  const domains = (domainsData as any).domains || [];

  const domainEntry = domains.find(
    (d: any) => d.enabled && normalizeDomain(String(d.domain || '')) === normalizedHost
  );
  if (domainEntry) {
    const site = sites.find((s: any) => s.id === domainEntry.siteId && s.enabled);
    const siteLocale = sanitizeLocale(site?.defaultLocale);
    if (siteLocale) return siteLocale;
  }

  const hostSite = sites.find(
    (s: any) => s.enabled && normalizeDomain(String(s.domain || '')) === normalizedHost
  );
  const hostLocale = sanitizeLocale(hostSite?.defaultLocale);
  if (hostLocale) return hostLocale;

  const envSiteId = process.env.NEXT_PUBLIC_DEFAULT_SITE;
  if (envSiteId) {
    const envSite = sites.find((s: any) => s.id === envSiteId && s.enabled);
    const envLocale = sanitizeLocale(envSite?.defaultLocale);
    if (envLocale) return envLocale;
  }

  const firstEnabledSite = sites.find((s: any) => s.enabled);
  const firstEnabledLocale = sanitizeLocale(firstEnabledSite?.defaultLocale);
  if (firstEnabledLocale) return firstEnabledLocale;

  return defaultLocale;
}

function parseDefaultLocale(payload: unknown): string | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const row = payload[0] as { default_locale?: string };
  return sanitizeLocale(row?.default_locale ?? null);
}

async function fetchSiteLocaleById(
  supabaseUrl: string,
  serviceRoleKey: string,
  siteId: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/sites?select=default_locale&enabled=eq.true&id=eq.${encodeURIComponent(
    siteId
  )}&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  return parseDefaultLocale(data);
}

async function fetchSiteLocaleByDomain(
  supabaseUrl: string,
  serviceRoleKey: string,
  normalizedHost: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/sites?select=default_locale&enabled=eq.true&domain=eq.${encodeURIComponent(
    normalizedHost
  )}&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  return parseDefaultLocale(data);
}

async function fetchFirstEnabledSiteLocale(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/sites?select=default_locale&enabled=eq.true&limit=1&order=created_at.asc`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  return parseDefaultLocale(data);
}

async function fetchSiteIdByAliasDomain(
  supabaseUrl: string,
  serviceRoleKey: string,
  normalizedHost: string
): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/site_domains?select=site_id&enabled=eq.true&domain=eq.${encodeURIComponent(
    normalizedHost
  )}&order=is_primary.desc&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as Array<{ site_id?: string }>;
  const siteId = data?.[0]?.site_id;
  return typeof siteId === 'string' ? siteId : null;
}

async function getSiteDefaultLocaleFromDb(host: string): Promise<string | null> {
  const normalizedHost = normalizeDomain(host);
  if (!normalizedHost) return null;

  const cached = localeCache.get(normalizedHost);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.locale;
  }

  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    // 1) Match explicit domain alias mapping from Admin > Sites > Domain Aliases.
    const matchedSiteId = await fetchSiteIdByAliasDomain(
      supabaseUrl,
      serviceRoleKey,
      normalizedHost
    );
    if (matchedSiteId) {
      const locale = await fetchSiteLocaleById(supabaseUrl, serviceRoleKey, matchedSiteId);
      if (locale) {
        localeCache.set(normalizedHost, { locale, expiresAt: now + CACHE_TTL_MS });
        return locale;
      }
    }

    // 2) Match sites.domain directly.
    const domainLocale = await fetchSiteLocaleByDomain(supabaseUrl, serviceRoleKey, normalizedHost);
    if (domainLocale) {
      localeCache.set(normalizedHost, { locale: domainLocale, expiresAt: now + CACHE_TTL_MS });
      return domainLocale;
    }

    // 3) Environment-selected default site.
    const envSiteId = process.env.NEXT_PUBLIC_DEFAULT_SITE;
    if (envSiteId) {
      const envLocale = await fetchSiteLocaleById(supabaseUrl, serviceRoleKey, envSiteId);
      if (envLocale) {
        localeCache.set(normalizedHost, { locale: envLocale, expiresAt: now + CACHE_TTL_MS });
        return envLocale;
      }
    }

    // 4) First enabled site fallback.
    const firstLocale = await fetchFirstEnabledSiteLocale(supabaseUrl, serviceRoleKey);
    if (firstLocale) {
      localeCache.set(normalizedHost, { locale: firstLocale, expiresAt: now + CACHE_TTL_MS });
      return firstLocale;
    }
  } catch (error) {
    console.error('middleware DB locale lookup failed:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Attach x-store-slug to every request so shop rewrites forward it to pureherbhealth.
  // Resolves: env var → static map → DB (site_domains + sites.herb_store_slug).
  // The DB fallback means new sites added via admin are picked up automatically.
  const storeSlug = await resolveStoreSlugForHost(request.headers.get('host'));
  const requestHeaders = new Headers(request.headers);
  if (storeSlug) requestHeaders.set('x-store-slug', storeSlug);

  // Admin routes: require auth cookie (verify in API/routes)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Skip middleware for static files, API routes, and admin
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/apple-icon' ||
    pathname.startsWith('/apple-icon/') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Redirect to site-specific locale:
  // DB (Admin-updated) first, JSON fallback second.
  const host = request.headers.get('host') || '';
  const dbLocale = await getSiteDefaultLocaleFromDb(host);
  const siteLocale = dbLocale || getSiteDefaultLocaleFromJson(host);
  const newUrl = new URL(`/${siteLocale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded media)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|uploads).*)',
  ],
};
