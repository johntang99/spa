import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

interface RedirectEntry {
  source: string;
  destination: string;
  permanent: boolean;
}

interface HreflangEntry {
  [locale: string]: string;
}

interface RedirectsFile {
  redirects: RedirectEntry[];
  hreflang?: HreflangEntry[];
}

// Cache per siteId so we only read the file once per process
const redirectCache = new Map<string, Map<string, RedirectEntry>>();
const hreflangCache = new Map<string, Map<string, HreflangEntry>>();

function loadRedirectsFile(siteId: string): RedirectsFile | null {
  const filePath = path.join(CONTENT_DIR, siteId, 'redirects.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as RedirectsFile;
  } catch {
    return null;
  }
}

function loadRedirects(siteId: string): Map<string, RedirectEntry> {
  const cached = redirectCache.get(siteId);
  if (cached) return cached;

  const map = new Map<string, RedirectEntry>();
  const file = loadRedirectsFile(siteId);
  if (file) {
    for (const entry of file.redirects) {
      map.set(entry.source, entry);
    }
  }

  redirectCache.set(siteId, map);
  return map;
}

function loadHreflang(siteId: string): Map<string, HreflangEntry> {
  const cached = hreflangCache.get(siteId);
  if (cached) return cached;

  const map = new Map<string, HreflangEntry>();
  const file = loadRedirectsFile(siteId);
  if (file?.hreflang) {
    for (const entry of file.hreflang) {
      for (const [locale, slug] of Object.entries(entry)) {
        map.set(`${locale}:${slug}`, entry);
      }
    }
  }

  hreflangCache.set(siteId, map);
  return map;
}

/**
 * Check if the current request path has a redirect configured for this site.
 * Returns the redirect entry if found, or null.
 */
export function checkSiteRedirect(
  siteId: string,
  locale: string,
  slug: string
): RedirectEntry | null {
  const map = loadRedirects(siteId);
  const requestPath = `/${locale}/${slug}`;
  return map.get(requestPath) ?? null;
}

/**
 * Get alternate locale URLs for hreflang tags.
 * Returns a map of locale -> slug for the given page, or null if no mapping exists.
 */
export function getHreflangAlternates(
  siteId: string,
  locale: string,
  slug: string
): Record<string, string> | null {
  const map = loadHreflang(siteId);
  const entry = map.get(`${locale}:${slug}`);
  if (!entry) return null;

  const alternates: Record<string, string> = {};
  for (const [altLocale, altSlug] of Object.entries(entry)) {
    if (altLocale !== locale) {
      alternates[altLocale] = `/${altLocale}/${altSlug}`;
    }
  }
  return Object.keys(alternates).length > 0 ? alternates : null;
}
